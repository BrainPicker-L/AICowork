# Git 仓库设置指南

本指南将帮助您设置本地 Git 仓库，并将其连接到两个远程仓库：
- GitHub: https://github.com/Pan519/AICowork
- 私有服务器: http://192.168.199.239:8418/Alan/AICowork.git

## 步骤 1: 初始化 Git 仓库

如果尚未初始化 Git 仓库，请运行以下命令：

```bash
cd c:\myproject\AICowork
git init
git add .
git commit -m "Initial commit"
```

## 步骤 2: 添加远程仓库

添加两个远程仓库地址：

```bash
git remote add origin https://github.com/Pan519/AICowork
git remote add private http://192.168.199.239:8418/Alan/AICowork.git
```

## 步骤 3: 推送代码到两个远程仓库

首次推送（设置上游分支）：

```bash
# 推送到 GitHub
git push -u origin main

# 推送到私有服务器
git push -u private main
```

## 步骤 4: 后续推送

之后，您可以同时推送到两个远程仓库：

```bash
# 方法 1: 分别推送
git push origin main
git push private main

# 方法 2: 配置 origin 同时推送到两个仓库
git remote set-url --add origin http://192.168.199.239:8418/Alan/AICowork.git
# 这样配置后，'git push' 命令会同时推送到两个仓库
```

## 验证远程仓库配置

您可以使用以下命令验证远程仓库配置：

```bash
git remote -v
```

应该能看到类似以下的输出：

```
origin  https://github.com/Pan519/AICowork (fetch)
origin  https://github.com/Pan519/AICowork (push)
origin  http://192.168.199.239:8418/Alan/AICowork.git (push)
private http://192.168.199.239:8418/Alan/AICowork.git (fetch)
private http://192.168.199.239:8418/Alan/AICowork.git (push)
```

注意：如果您需要推送相同的代码到两个仓库，方法 2 会更方便，因为它允许您使用单个 `git push` 命令同时推送到两个仓库。

## 注意事项

- 确保您有访问这两个远程仓库的适当权限
- 如果远程仓库不存在，推送操作将会失败，您需要先在对应平台上创建仓库
- 对于私有服务器，可能需要额外的身份验证配置