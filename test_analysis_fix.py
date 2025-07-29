#!/usr/bin/env python3
"""
測試AI分析功能修復的腳本
"""

import requests
import json
import time

def test_backend_health():
    """測試後端健康狀態"""
    try:
        response = requests.get('http://localhost:8000/', timeout=5)
        print(f"✅ 後端健康檢查: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ 後端健康檢查失敗: {e}")
        return False

def test_jobs_list():
    """測試獲取訓練任務列表"""
    try:
        response = requests.get('http://localhost:8000/train/train/jobs', timeout=5)
        print(f"✅ 獲取訓練任務列表: {response.status_code}")
        if response.status_code == 200:
            jobs = response.json()
            print(f"   找到 {len(jobs)} 個訓練任務")
            return jobs
        return []
    except Exception as e:
        print(f"❌ 獲取訓練任務列表失敗: {e}")
        return []

def test_analysis_endpoints(job_id):
    """測試分析相關的端點"""
    endpoints = [
        f'/analysis/{job_id}/curve',
        f'/analysis/{job_id}/heatmap',
        f'/analysis/{job_id}/optimal-path',
        f'/analysis/{job_id}/config.json',
        f'/analysis/{job_id}/rule.json',
        f'/analysis/{job_id}/map.json',
        f'/analysis/{job_id}/analysis.html',
        f'/analysis/{job_id}/report'
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            response = requests.get(f'http://localhost:8000{endpoint}', timeout=5)
            status = response.status_code
            print(f"    {endpoint}: {status}")
            results[endpoint] = status
        except Exception as e:
            print(f"    {endpoint}: 錯誤 - {e}")
            results[endpoint] = 'ERROR'
    
    return results

def test_analysis_generation(job_id):
    """測試分析生成功能"""
    try:
        response = requests.post(
            f'http://localhost:8000/analysis/{job_id}/analyze-and-save',
            json={'user_prompt': '請分析這個強化學習訓練結果'},
            timeout=30
        )
        print(f"✅ 分析生成測試: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   返回數據類型: {list(data.keys()) if isinstance(data, dict) else '非字典'}")
            return True
        return False
    except Exception as e:
        print(f"❌ 分析生成測試失敗: {e}")
        return False

def main():
    """主測試函數"""
    print("🔍 開始測試AI分析功能修復...")
    print("=" * 50)
    
    # 1. 測試後端健康狀態
    if not test_backend_health():
        print("❌ 後端未運行，請先啟動後端服務")
        return
    
    # 2. 獲取訓練任務列表
    jobs = test_jobs_list()
    if not jobs:
        print("❌ 沒有找到訓練任務，請先進行一些訓練")
        return
    
    # 3. 選擇第一個任務進行測試
    test_job = jobs[0]
    job_id = test_job['job_id']
    print(f"\n🎯 測試任務: {test_job.get('job_name', '未命名')} ({job_id})")
    
    # 4. 測試分析端點
    print("\n📊 測試分析端點:")
    endpoint_results = test_analysis_endpoints(job_id)
    
    # 5. 統計結果
    success_count = sum(1 for status in endpoint_results.values() if status == 200)
    total_count = len(endpoint_results)
    print(f"\n📈 端點測試結果: {success_count}/{total_count} 成功")
    
    # 6. 測試分析生成
    print("\n🤖 測試分析生成功能:")
    if test_analysis_generation(job_id):
        print("✅ 分析生成功能正常")
    else:
        print("❌ 分析生成功能異常")
    
    print("\n" + "=" * 50)
    print("🎉 測試完成！")
    
    # 7. 提供使用建議
    print("\n💡 使用建議:")
    print("1. 確保後端服務正在運行 (python main.py)")
    print("2. 確保前端服務正在運行 (cd frontend && npm start)")
    print("3. 在瀏覽器中訪問 http://localhost:3000")
    print("4. 進入AI分析頁面測試功能")

if __name__ == "__main__":
    main() 