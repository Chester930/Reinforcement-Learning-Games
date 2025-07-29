#!/usr/bin/env python3
"""
測試UI按鈕修改的腳本
"""

import requests
import json

def test_ui_improvements():
    """測試UI改進"""
    print("🔍 測試UI按鈕改進...")
    print("=" * 40)
    
    # 1. 檢查後端是否運行
    try:
        response = requests.get('http://localhost:8000/', timeout=5)
        if response.status_code == 200:
            print("✅ 後端服務正常運行")
        else:
            print("❌ 後端服務異常")
            return
    except Exception as e:
        print(f"❌ 無法連接到後端: {e}")
        return
    
    # 2. 檢查訓練任務
    try:
        response = requests.get('http://localhost:8000/train/train/jobs', timeout=5)
        if response.status_code == 200:
            jobs = response.json()
            print(f"✅ 找到 {len(jobs)} 個訓練任務")
            
            if jobs:
                # 選擇第一個任務進行測試
                test_job = jobs[0]
                job_id = test_job['job_id']
                print(f"🎯 測試任務: {test_job.get('job_name', '未命名')}")
                
                # 3. 測試分析端點
                print("\n📊 測試分析相關端點:")
                endpoints = [
                    f'/analysis/{job_id}/curve',
                    f'/analysis/{job_id}/heatmap',
                    f'/analysis/{job_id}/optimal-path',
                    f'/analysis/{job_id}/config.json'
                ]
                
                for endpoint in endpoints:
                    try:
                        response = requests.get(f'http://localhost:8000{endpoint}', timeout=5)
                        status = "✅" if response.status_code == 200 else "❌"
                        print(f"   {status} {endpoint}: {response.status_code}")
                    except Exception as e:
                        print(f"   ❌ {endpoint}: 錯誤")
                
                print("\n🎉 UI改進測試完成！")
                print("\n💡 現在您可以:")
                print("1. 訪問 http://localhost:3000")
                print("2. 進入AI分析頁面")
                print("3. 選擇訓練任務")
                print("4. 在標題旁邊看到新的按鈕:")
                print("   - 🤖 生成分析報告 (如果沒有報告)")
                print("   - 🔄 重新分析 (如果有報告)")
                print("5. 路徑模擬保持原來的簡潔設計")
                
            else:
                print("❌ 沒有找到訓練任務")
        else:
            print("❌ 無法獲取訓練任務列表")
            
    except Exception as e:
        print(f"❌ 測試失敗: {e}")

if __name__ == "__main__":
    test_ui_improvements() 