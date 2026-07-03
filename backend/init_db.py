from backend.db.session import engine, Base
from backend.models.generation import ImageGeneration

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

if __name__ == "__main__":
    init_db()
