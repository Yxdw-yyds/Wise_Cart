import requests
import json

def get_recommendations(user_id, top_k=5):
    url = "http://127.0.0.1:8000/recommend"
    payload = {
        "user_id": user_id,
        "top_k": top_k
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 为用户 {user_id} 推荐的前 {top_k} 个项目 ID 为: {data['recommendations']}")
        else:
            print(f"❌ 请求失败，状态码: {response.status_code}, 错误信息: {response.text}")
    except Exception as e:
        print(f"❌ 发生异常: {e}")

if __name__ == "__main__":
    # 测试用户 ID 0，请求前 5 个推荐
    get_recommendations(user_id=0, top_k=5)
