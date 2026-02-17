---\\
title: 'Ubuntu 初始�?
titleJp: ''
date: '2025.01.04'
excerpt: 'ubuntu'
tags: ['backend']\\
---
拿到一台崭新的 Ubuntu 服务器，或者刚装好的虚拟机，这种感觉确实挺有仪式感的。面对那个光秃秃的黑框终端，虽然咱们已经习惯性地敲了 update �?install git，但这仅仅是个开始。想要把它变成得心应手的生产力工具，还得再费点心思打磨一下�?

这也是我每次配置新环境时的固定流程，记录下来供大家参考�?


拿到一台全新的 Ubuntu 服务器或者刚装好的本地虚拟机，通常也就是跑�?apt update �?git 安装就算是准备好了。不过对着默认那个黑漆漆的 Bash 终端，时间久了确实容易累�?

我习惯在开工前花点时间把环境弄得顺手一点。这里记录一下我把默�?Shell 换成 Zsh 的过程，顺便聊聊在远程开发时怎么正确配置字体，以及怎么解决切换 Shell 导致命令找不到的问题�?

基础准备

起步阶段没那么多讲究，先把系统更新跑完，再把那些编译代码或者解压文件时肯定会用到的工具一次性补齐。像 build-essential 这种包，现在不装以后编译什么东西报错了还得回头找原因，不如现在就加上。另外推荐个 btop，比系统自带�?top 直观太多，监控资源的时候心情都能好点�?

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git build-essential curl wget vim unzip zip htop -y
```

Shell 的选择与改�?

默认�?Bash 虽然稳定，但在交互体验上确实不如 Zsh。Zsh 的自动补全和历史查找功能，用习惯了就回不去了�?

先把 Zsh 装上�?

```bash
sudo apt install zsh -y
chsh -s $(which zsh)
```

这时候系统会提示你输入密码来更改默认 Shell，记得通常需要注销或者重启一次终端才会生效�?

光有 Zsh 还不够，还得配上 Oh My Zsh 这个管理框架，它能省去很多手动配置文件的麻烦�?

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

装完之后，我强烈建议加上两个插件。一个是语法高亮，能在你敲命令的时候通过颜色告诉你命令对不对；另一个是自动建议，它会根据你以前敲过的命令给你灰色提示，按右方向键就能自动补全�?

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

把插件下载好之后，还需要去配置文件里启用它们。打开主目录下�?.zshrc 文件，找�?plugins 开头的那一行，把这两个插件加进去�?

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

改完记得 source 一下配置文件让它立即生效�?

```bash
source ~/.zshrc
```

关于字体的误�?

这一点在远程开发的时候特别容易混淆。很多人觉得要在 Ubuntu 服务器上安装字体，终端才能显示得漂亮。其实服务器只负责发送字符编码，至于这个字符长什么样，完全是由你本地的终端软件决定的�?

所以我们不需要在 Linux 服务器上折腾字体，而是应该�?JetBrains Mono 下载到你现在用的这台 Windows 或�?Mac 电脑上�?

去官网下载好字体包，解压安装。然后打开你常用的终端软件，比�?VS Code。在设置里搜�?Font Family，把 JetBrains Mono 填进去。顺便把 Ligatures 连字功能也打开，这样箭头之类的符号显示出来会更舒服�?

只要本地配置好了，连上任何服务器都会显示这个字体�?

迁移环境变量

切换�?Zsh 后常会遇到一个问题，就是之前装好�?Bun 或�?Conda 突然提示找不到命令了。原因很简单，这些软件安装的时候把路径写进�?Bash 的配置文件里，Zsh 默认是不会去�?Bash 配置的�?

解决办法就是把这些环境变量搬�?Zsh 的配置文件里去。可以在 .zshrc 文件的末尾追加下面的内容�?

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

if [ -f /root/clashctl/scripts/cmd/clashctl.sh ]; then
    . /root/clashctl/scripts/cmd/clashctl.sh
    type watch_proxy >/dev/null 2>&1 && watch_proxy
fi
```

保存之后再次 source 一下配置文件�?

```bash
source ~/.zshrc
```

到现在为止，终端有了高亮提示，字体看着也舒服，之前消失的命令也都找回来了。环境顺手了，写代码的心情应该也会好不少�?


Git 装好了如果不配置，提交代码时总会弹一堆提示。顺手把用户名和邮箱设好，核心编辑器我习惯设�?Vim，当然你习惯 Nano 也行。最关键的是 SSH 密钥，现在就生成好贴�?GitHub 上，省得一会推代码的时候还要输密码，那种打断思路的感觉很糟糕�?

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
git config --global core.editor vim
ssh-keygen -t ed25519 -C "your_email@example.com"
```

现在做开发基本离不开 Docker 了，无论是跑数据库还是起测试环境，容器化都是最干净的方案。直接用官方的一键脚本安装最省心。这里有个细节要注意，装完记得把当前用户加到 docker 用户组里，不然每次跑命令都得�?sudo，敲多了手指头疼�?

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

关于语言环境，千万别直接�?apt install 去装 Node 或�?Python，那个版本通常老得掉牙。我更推荐用版本管理工具，比�?Node 就用 nvm，Java 必须�?SDKMAN。这样以后项目需要切换不同版本的时候，也就是一条命令的事，不需要去系统底层折腾动态链接库�?

```bash
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

经过这一通折腾，这台机器才算是真正属于你了。基础库齐备，终端智能又美观，Git �?Docker 也都这就绪。这时候再把代码拉下来，那种丝般顺滑的开发体验，才对得起刚才花掉的这十几分钟�