from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "postgresql://sudo:postgres@localhost:5432/noderift"

engine = create_engine(DATABASE_URL)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    school = Column(String, nullable=False)
    city = Column(String, nullable=False)


# Delete old table completely
with engine.connect() as connection:
    connection.execute(text("DROP TABLE IF EXISTS users"))
    connection.commit()


# Create new table with all columns
Base.metadata.create_all(engine)


SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()


users = [
    User(name="Aarav Sharma", age=21,
         school="Delhi Public School", city="New Delhi"),

    User(name="Diya Patel", age=19,
         school="St. Xavier's School", city="Mumbai"),

    User(name="Kabir Singh", age=23,
         school="Ryan International School", city="Bangalore"),

    User(name="Ananya Verma", age=20,
         school="Modern School", city="New Delhi"),

    User(name="Rohan Mehta", age=22,
         school="The Doon School", city="Dehradun"),

    User(name="Ishita Gupta", age=18,
         school="Loreto Convent School", city="Kolkata"),

    User(name="Aditya Rao", age=24,
         school="National Public School", city="Bangalore"),

    User(name="Meera Iyer", age=21,
         school="DAV Public School", city="Chennai"),

    User(name="Arjun Kapoor", age=20,
         school="Bishop Cotton School", city="Shimla"),

    User(name="Sneha Joshi", age=22,
         school="Kendriya Vidyalaya", city="Pune"),
]


session.add_all(users)
session.commit()


print("Database reset successfully!\n")

for user in session.query(User).all():
    print(
        f"{user.id} | {user.name} | "
        f"{user.age} | {user.school} | {user.city}"
    )

session.close()