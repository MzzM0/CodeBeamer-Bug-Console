# CodeBeamer Bug 批量流转工具免安装版

当前发布版本：`v1.0.4`

## 特点

- 不需要额外安装 Node.js
- 解压后即可直接运行
- 浏览器会自动打开本地页面

## 使用方法

1. 解压整个压缩包到任意目录。
2. 双击 `launch-local.bat`。
3. 浏览器会自动打开 `http://127.0.0.1:3080`。
4. 在页面中输入：
   - `Base URL`
   - `用户名`
   - `密码`
5. 读取项目后，选择目标项目和 Bugs Tracker，即可开始使用。

## 关闭方法

- 双击 `stop-local.bat`。

## 开机自启

- 双击 `install-startup.bat` 后，会为当前 Windows 用户添加开机自启快捷方式，不需要管理员权限。
- 之后每次登录 Windows 时会自动启动本地服务并打开页面。
- 如需取消开机自启，双击 `uninstall-startup.bat`。

## 注意事项

- 请不要删除 `runtime` 目录，其中包含运行所需的内置 Node 运行时。
- 本工具默认监听本机 `3080` 端口。
- 账号密码不会写入本地文件，只用于当前页面和本地代理请求。

## 源码管理

- 建议将源码上传到 GitHub 仓库管理，`release` 发布包、运行日志、`.pid`、CodeBeamer 导出 JSON 和本地分析文档默认不入库。
- 需要分发给其他人使用时，可以将 `release` 下的 zip 作为 GitHub Release 附件或单独发送。
- 首次关联 GitHub 仓库时，可在安装 Git 后执行：

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <你的 GitHub 仓库地址>
git push -u origin main
```
