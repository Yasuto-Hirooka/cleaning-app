import requests
import time

def check_url(url, name):
    try:
        response = requests.get(url, timeout=5)
        print(f"{name} ({url}): Status {response.status_code} - OK")
        return True
    except Exception as e:
        print(f"{name} ({url}): Error - {e}")
        return False

# Wait a few seconds for servers to stay up
time.sleep(2)

b_ok = check_url('http://127.0.0.1:8000/api/rooms', 'Backend')
f_ok = check_url('http://127.0.0.1:5173', 'Frontend')

if b_ok and f_ok:
    print("ALL_SERVERS_OK")
else:
    print("SERVER_CHECK_FAILED")
