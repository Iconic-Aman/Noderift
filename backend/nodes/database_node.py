import json
from typing import Dict, Any
from sqlalchemy import create_engine, text
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node

@register_node
class DatabaseNode(BaseNode):
    node_type = "database"
    display_name = "Database"
    description = "Query SQL (Postgres/MySQL) or MongoDB databases"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        db_type = config.get("db_type", "postgres")
        conn_type = config.get("connection_type", "connection_string")
        
        # Build connection URL
        if conn_type == "connection_string":
            conn_url = config.get("connection_string", "")
        else:
            host = config.get("host", "")
            port = config.get("port", "")
            user = config.get("username", "")
            password = config.get("password", "")
            db_name = config.get("database_name", "")
            
            if db_type == "postgres":
                port_val = port or 5432
                conn_url = f"postgresql://{user}:{password}@{host}:{port_val}/{db_name}"
            elif db_type == "mysql":
                port_val = port or 3306
                conn_url = f"mysql+pymysql://{user}:{password}@{host}:{port_val}/{db_name}"
            elif db_type == "mongodb":
                port_val = port or 27017
                if user and password:
                    conn_url = f"mongodb://{user}:{password}@{host}:{port_val}/{db_name}"
                else:
                    conn_url = f"mongodb://{host}:{port_val}/{db_name}"
            else:
                conn_url = ""

        if not conn_url:
            raise ValueError("Connection details or URL is missing.")

        if db_type == "mongodb":
            from pymongo import MongoClient
            client = MongoClient(conn_url)
            try:
                db_name = config.get("database_name")
                if not db_name:
                    db_name = client.get_default_database().name
                db = client[db_name]
                
                collection_name = config.get("mongodb_collection", "")
                operation = config.get("mongodb_operation", "find")
                query_str = config.get("mongodb_query", "{}")
                
                try:
                    query_json = json.loads(query_str) if query_str else {}
                except Exception as e:
                    raise ValueError(f"Invalid MongoDB query JSON: {e}")
                
                coll = db[collection_name]
                if operation == "find":
                    results = list(coll.find(query_json))
                    for r in results:
                        if "_id" in r:
                            r["_id"] = str(r["_id"])
                    return NodeOutput(data={"results": results})
                elif operation == "insert":
                    res = coll.insert_one(query_json)
                    return NodeOutput(data={"inserted_id": str(res.inserted_id), "status": "success"})
                elif operation == "update":
                    filt = query_json.get("filter", {})
                    update = query_json.get("update", {})
                    res = coll.update_many(filt, update)
                    return NodeOutput(data={"matched_count": res.matched_count, "modified_count": res.modified_count})
                elif operation == "delete":
                    res = coll.delete_many(query_json)
                    return NodeOutput(data={"deleted_count": res.deleted_count})
                else:
                    raise ValueError(f"Unsupported MongoDB operation: {operation}")
            finally:
                client.close()
        else:
            if db_type == "mysql" and not conn_url.startswith("mysql"):
                raise ValueError("Expected MySQL connection URL.")
            if db_type == "postgres" and conn_url.startswith("postgres://"):
                conn_url = conn_url.replace("postgres://", "postgresql://", 1)

            engine = create_engine(conn_url)
            query_text = config.get("query", "") or config.get("query_mysql", "")
            
            with engine.connect() as conn:
                result = conn.execute(text(query_text))
                if result.returns_rows:
                    rows = [dict(r._mapping) for r in result]
                    for r in rows:
                        for k, v in r.items():
                            if hasattr(v, "isoformat"):
                                r[k] = v.isoformat()
                    return NodeOutput(data={"results": rows})
                else:
                    conn.commit()
                    return NodeOutput(data={"row_count": result.rowcount, "status": "success"})
