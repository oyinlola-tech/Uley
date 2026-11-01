import uvicorn

if __name__ == "__main__":
    uvicorn.run("src.application:application", host="0.0.0.0", port=8020)
