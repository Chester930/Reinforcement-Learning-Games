#!/usr/bin/env python3
"""
強化學習平台環境檢查腳本
檢查所有必要的套件和設定是否正確
"""

import sys
import os
import subprocess
import importlib

def check_python_version():
    """檢查 Python 版本"""
    print("🐍 檢查 Python 版本...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 版本過舊: {version.major}.{version.minor}")
        print("   建議使用 Python 3.8 或更新版本")
        return False
    else:
        print(f"✅ Python 版本: {version.major}.{version.minor}.{version.micro}")
        return True

def check_required_packages():
    """檢查必要的 Python 套件"""
    print("\n📦 檢查必要套件...")
    required_packages = [
        'numpy', 'pandas', 'fastapi', 'uvicorn', 'matplotlib',
        'markdown2', 'requests', 'pydantic', 'python_multipart'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            importlib.import_module(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - 未安裝")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  缺少套件: {', '.join(missing_packages)}")
        print("請執行: pip install -r requirements.txt")
        return False
    else:
        print("✅ 所有必要套件都已安裝")
        return True

def check_node_installation():
    """檢查 Node.js 安裝"""
    print("\n🟢 檢查 Node.js...")
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
            return True
        else:
            print("❌ Node.js 未正確安裝")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Node.js 未安裝")
        print("請從 https://nodejs.org/ 下載並安裝 Node.js")
        return False

def check_npm_packages():
    """檢查前端套件"""
    print("\n📦 檢查前端套件...")
    frontend_dir = "frontend"
    if not os.path.exists(frontend_dir):
        print("❌ frontend 目錄不存在")
        return False
    
    node_modules = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules):
        print("⚠️  node_modules 不存在，需要安裝前端套件")
        print("請執行: cd frontend && npm install")
        return False
    
    print("✅ 前端套件已安裝")
    return True

def check_project_files():
    """檢查專案檔案"""
    print("\n📁 檢查專案檔案...")
    required_files = [
        'main.py', 'requirements.txt', 'frontend/package.json'
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - 不存在")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"\n⚠️  缺少檔案: {', '.join(missing_files)}")
        return False
    else:
        print("✅ 所有必要檔案都存在")
        return True

def main():
    """主檢查函數"""
    print("🔍 強化學習平台環境檢查")
    print("=" * 50)
    
    checks = [
        check_python_version(),
        check_required_packages(),
        check_node_installation(),
        check_npm_packages(),
        check_project_files()
    ]
    
    print("\n" + "=" * 50)
    if all(checks):
        print("🎉 環境檢查通過！可以開始使用平台")
        print("\n啟動指令：")
        print("1. 後端: python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        print("2. 前端: cd frontend && npm start")
        print("3. 瀏覽器: http://localhost:3000")
    else:
        print("❌ 環境檢查失敗，請解決上述問題後重試")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 