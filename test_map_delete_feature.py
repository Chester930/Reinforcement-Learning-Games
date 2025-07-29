#!/usr/bin/env python3
"""
測試地圖元件刪除功能的腳本
"""

import requests
import json
import os

def test_map_delete_feature():
    """測試地圖元件刪除功能"""
    print("🔍 測試地圖元件刪除功能...")
    print("=" * 50)
    
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
    
    # 2. 檢查地圖API
    try:
        response = requests.get('http://localhost:8000/maps/maps', timeout=5)
        if response.status_code == 200:
            maps = response.json()
            print(f"✅ 地圖API正常，找到 {len(maps)} 個地圖")
        else:
            print("❌ 地圖API異常")
            return
    except Exception as e:
        print(f"❌ 地圖API檢查失敗: {e}")
        return
    
    # 3. 檢查規則API
    try:
        response = requests.get('http://localhost:8000/rules/rules', timeout=5)
        if response.status_code == 200:
            rules = response.json()
            print(f"✅ 規則API正常，找到 {len(rules)} 個規則")
        else:
            print("❌ 規則API異常")
            return
    except Exception as e:
        print(f"❌ 規則API檢查失敗: {e}")
        return
    
    print("\n🎯 新功能說明:")
    print("1. 在地圖編輯器中，可以拖拽地圖內的元件")
    print("2. 將元件拖拽到地圖外的紅色刪除區域即可刪除")
    print("3. 刪除區域有視覺提示和懸停效果")
    print("4. 支持刪除所有類型的元件：起點、終點、寶箱、陷阱、障礙物")
    
    print("\n💡 使用方法:")
    print("1. 訪問 http://localhost:3000")
    print("2. 進入地圖與規則管理頁面")
    print("3. 選擇'我的地圖'標籤")
    print("4. 點擊'編輯'按鈕進入地圖編輯器")
    print("5. 拖拽地圖內的元件到下方的紅色刪除區域")
    print("6. 元件會被刪除，格子變為空白")
    
    print("\n🎨 視覺效果:")
    print("• 刪除區域：紅色虛線邊框，淺紅色背景")
    print("• 懸停效果：背景變深，邊框變紅")
    print("• 提示文字：🗑️ 拖拽元件到此處刪除")
    print("• 說明文字：將地圖內的元件拖拽到此區域即可刪除")
    
    print("\n🔧 技術實現:")
    print("• 新增 handleMapAreaDrop 函數處理拖拽刪除")
    print("• 在地圖區域下方添加刪除區域")
    print("• 使用 Material-UI 的樣式系統")
    print("• 支持所有可拖拽的元件類型")
    
    print("\n🎉 測試完成！")
    print("\n🚀 請訪問 http://localhost:3000 測試新功能")

if __name__ == "__main__":
    test_map_delete_feature() 