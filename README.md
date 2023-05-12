# zj

1.修改命令 #查看关联的远程仓库
git remote -v

    git remote set-url origin [url]

    例：git remote set-url origin gitlab@yang/BarUtils.git

2.先删后加

        git remote rm origin
    git remote add origin [url]

    例：git remote add origin gitlab@yang/BarUtils.git

3.直接修改.git 文件夹下的 config 文件
[core]
repositoryformatversion = 0
filemode = false
bare = false
logallrefupdates = true
symlinks = false
ignorecase = true
[submodule]
active = .
[remote "origin"]
url = https://github.com/yang/BarUtils.git
fetch = +refs/heads/_:refs/remotes/origin/_
[branch "master"]
remote = origin
merge = refs/heads/maste

ssh-keygen -t ed25519 -C "xxxxx@xxxxx.com"

按照提示完成三次回车，即可生成 ssh key。通过查看 ~/.ssh/id_ed25519.pub 文件内容，获取到你的 public key

复制生成后的 ssh key，通过仓库主页 「管理」->「部署公钥管理」->「添加部署公钥」 ，添加生成的 public key 添加到仓库中。

添加后，在终端（Terminal）中输入

ssh -T git@gitee.com

首次使用需要确认并添加主机到本机 SSH 可信列表。若返回 Hi XXX! You've successfully authenticated, but Gitee.com does not provide shell access. 内容，则证明添加成功。
