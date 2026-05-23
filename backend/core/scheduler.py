import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger as ApsCronTrigger
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.cron_trigger import CronTrigger
from models.workflow import Workflow
from models.execution import Execution
from worker import run_workflow_task

logger = logging.getLogger(__name__)

class WorkflowScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            logger.warning("[SCHEDULER] Background scheduler started")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.warning("[SCHEDULER] Background scheduler shut down")

    def sync_triggers(self, db: Session):
        """Remove all existing jobs and reload active CronTriggers from DB."""
        self.scheduler.remove_all_jobs()
        logger.warning("[SCHEDULER] Cleared all scheduled jobs")

        active_triggers = db.query(CronTrigger).filter(CronTrigger.is_active == True).all()
        for trigger in active_triggers:
            wf = db.query(Workflow).filter(Workflow.id == trigger.workflow_id).first()
            if wf and wf.is_active:
                self.add_workflow_job(trigger.id, trigger.workflow_id, trigger.cron_expression, trigger.timezone)

    def add_workflow_job(self, trigger_id: str, workflow_id: str, cron_expression: str, tz_name: str):
        job_id = f"cron_{trigger_id}"
        try:
            self.scheduler.add_job(
                func=self.trigger_workflow,
                trigger=ApsCronTrigger.from_crontab(cron_expression, timezone=tz_name),
                args=[trigger_id, workflow_id],
                id=job_id,
                replace_existing=True
            )
            job = self.scheduler.get_job(job_id)
            if job:
                # Update next_run_at in DB
                db = SessionLocal()
                db_trigger = db.query(CronTrigger).filter(CronTrigger.id == trigger_id).first()
                if db_trigger:
                    db_trigger.next_run_at = job.next_run_time
                    db.commit()
                db.close()
                logger.warning(f"[SCHEDULER] Scheduled workflow {workflow_id} (job_id: {job_id}) next run: {job.next_run_time}")
        except Exception as e:
            logger.error(f"[SCHEDULER] Failed to schedule trigger {trigger_id} for workflow {workflow_id}: {str(e)}")

    def remove_workflow_job(self, trigger_id: str):
        job_id = f"cron_{trigger_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
            logger.warning(f"[SCHEDULER] Removed job {job_id}")

    @staticmethod
    def trigger_workflow(trigger_id: str, workflow_id: str):
        """Executes a workflow when its scheduled cron fires."""
        db = SessionLocal()
        try:
            wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
            if not wf or not wf.is_active:
                logger.warning(f"[SCHEDULER] Workflow {workflow_id} is inactive, skipping scheduled run")
                return

            trigger = db.query(CronTrigger).filter(CronTrigger.id == trigger_id).first()
            if not trigger or not trigger.is_active:
                logger.warning(f"[SCHEDULER] Trigger {trigger_id} is inactive, skipping scheduled run")
                return

            # Create Execution record
            exc = Execution(
                workflow_id=workflow_id,
                status="pending",
                triggered_by="cron"
            )
            db.add(exc)
            db.commit()
            db.refresh(exc)

            # Trigger Celery Task
            payload = {
                "triggered_at": datetime.now(timezone.utc).isoformat(),
                "cron_expression": trigger.cron_expression,
                "timezone": trigger.timezone
            }
            run_workflow_task.delay(exc.id, trigger_payload=payload)
            logger.warning(f"[SCHEDULER] Scheduled run triggered for workflow {workflow_id}, execution_id: {exc.id}")

            # Update next_run_at for subsequent execution
            from core.scheduler import scheduler_manager
            job = scheduler_manager.scheduler.get_job(f"cron_{trigger_id}")
            if job:
                trigger.next_run_at = job.next_run_time
                db.commit()

        except Exception as e:
            logger.error(f"[SCHEDULER] Error executing scheduled workflow {workflow_id}: {str(e)}")
        finally:
            db.close()

scheduler_manager = WorkflowScheduler()
