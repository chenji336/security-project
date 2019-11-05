# 学习关于安全方面的前端知识
[课程来源](https://coding.imooc.com/class/chapter/104.html#Anchor)
## 环境搭建

#### 安装mysql

安装community版本，这个版本免费
[最终下载地址](https://dev.mysql.com/downloads/file/?id=484914),记得选择不要登陆下载
root Chenji336.

[简单安装](https://www.rigerwu.com/2018/04/23/Mac%20MySQL%20%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97/)

mysql在系统偏好里面可以看到（或则全局搜索mysql）

**执行命令**：
1. /usr/local/mysql-8.0.15-macos10.14-x86_64/bin/mysql -uroot -p然后输入密码
  - u 跟  root 不能有空格
  - 把bin文件放到了.zsh中，所以全局使用mysql
2. 进入mysql命令之后，可以取消密码 ALTER USER 'root'@'localhost' IDENTIFIED BY '';之后进入就可以 mysql -uroot
3. 进入mysql命令，show databases;(不要忘记分号)

**引入外部的sql进入**：
./mysql safety -uroot< /Users/liulei/Documents/GitHub/security/mk-project/safety.sql

**sql常用命令（进入mysql命令之后）**
show databases;
create database safety;
use safety; 切换数据库

show tables; // 查看数据里面的table
create table test(id int);
drop table test; 删除表
exit; 退出项目

#### 安装执行

1. npm i -g jspm
2. jspm install
3. npm install
如果报错可以在执行一遍看看

## 前端XSS

#### XSS介绍

XSS: Cross site scripting,跨站脚本攻击
> 本来应该叫做CSS，但是css常常代表样式，所以就改用X

本例子中：url的query中添加from参数，相应页面的header就会改变

XSS主要是通过加入script脚本获取到用户的cookie，然后就可以登陆进行一些欺骗操作了。可以在url中进行注入
我自己理解的防御：后台可以让前端获取不到cookie，httpOnly

攻击手段：
- 把带有script标签的url发给用户，如果用户点击了，就会被攻击（如果链接可疑，则使用短链）
- 插入一个js，js默认会生成一个img dom，img.src把带有cookie参数带给`攻击者服务器`

场景：
QQ空间进入到别人空间，然后发现自己就被盗号了

#### XSS攻击类型

两大类型

- 反射型：通过url参数直接注入，然后把url发送给受害者(如果直接给用户肯定看的出来，这个时候做成[短链](https://dwz.cn/))
- 注入型：存储到DB后读取时注入，比如评论里`添加xss攻击`

XSS攻击注入点：

- HTML节点内容，实例：
	- from=beijing<script>alert(1)</script>
	- 评论区添加xss攻击
- HTML属性：src=`image/1" onerror="alert(1)`,中间这样添加就可以攻击（图片avatarId来自url参数）
- javascript代码：from=`beijing";alert(1);"`,默认都有开始和闭合的引号(from也是url参数)
- 富文本: 评论区添加富文本

XSS防御：

- 浏览器自带的会防御注入到`HTML节点和属性`的XSS攻击,**但是通过url注入到js代码的工具不会防御**(demo不会是因为关闭了X-XSS-Protection)
- 转译成`HTML实体`，[相应字符实体表](https://www.w3school.com.cn/html/html_entities.asp) `site.js查看具体内容`
  - HTML内容转译，只显示text内容，只需要 `< => $gt; > => $lt;`
  - HTML属性转译，主要是 单引号、双引号、空格
  - javascript代码转译：如果用的是属性转译js显示就有问题
  	- `"` => `\"`,`'` => `\'`,
  	- `\` => `\\`,情型：from=beijing\";alert(1);//"， `//`代表注释
  	- 终极解决方法： JSON.stringify(xxx)，这样外面就默认是带有双引号了
  - 富文本`过滤`: 需要保留一些html标签，所以不能转译，而是过滤
  	输入的时候进行过滤性能消耗比输出少，因为输入时候过滤只要进行一次）,不过为了演示，我们代码是在输出的地方进行了过滤
  	- 黑名单过滤（变种太多了，所以写的不一定完整，不推荐使用）`site.js查看具体内容`
  	- 白名单进行过滤


#### CSP

内容安全策略（content security policy)

http头字段来进行限制

## CSRF

跨站请求伪造（Cross-site request forgery)

攻击方式：诱惑用户点击第三方网站进入，然后发送 被攻击网站 请求（默认会携带cookie，所以以为是本人操作）

#### CSRF攻击原理、场景以及危害

![攻击原理](./readmeImgs/CSRF攻击原理.png)

不经过A网站的前端，直接在B网站就可以发送A网站请求，所以防御可以针对：不`经过A网站前端`这里做文章

场景：
- 因为点击了某些链接进入，发现自己莫名发了一个说说，别人点击你的说说在进入自己也会发，这就是上章说的`蠕虫攻击`
- 银行转账

#### CSRF防御-samesite

原理：设置之后，第三方链接不能携带cookie进入网站
缺点： 兼容性不好

演示的时候注意：不同端口对于cookie来说不算跨域，更准确来说是cookie不算域

### CSRF防御-验证码

原理：

1. 后端生成验证码并且记录
2. 发送生成的验证码图片给前端
3. 前端输入验证码，当作参数传给后端
4. 后端验证是否正确，错误则不返回数据

如何攻击：攻击者可以提供验证码让客户去输入，不过这样成本就增加了

### CSRF防御-token

验证码缺点：客户每次都需要输入，还有可能输错，体验不好

原理：同验证码，只是每次都不需要客户自己输入了

### CSRF防御-referer

验证发送请求的来源，通过 `request.headers.referer` 判断


## 前端cookies问题

#### cookies特性

后端设置： set-cookie
前端设置：
- 添加：document.cookie='k1=v1;k2=v2;',再次访问发现只有k1=v1
- 删除：document.cookie='k1=v1;expires:Tue Nov 05 2019 22:01:35 GMT+0800',时间设置小于当前就好

特性(观察 chrome-application-cookie 对应的属性）：

- host
- path: 不同路径下面有不同cookie
- secure： https才允许携带cookie
- http-only：document.cookie 获取不到
- expires：过期时间
  - session代表本次会话，关闭才会过期
  - 格式：new Date() GMT
- samesite: 相同的域名才能携带cookie

#### cookies作用

**登录用户凭证**

使用userId做为凭证

	缺点：明文，容易被串改，所以需要`加密`

	改进：userId+签名，通过node自带的模块 crypt 进行加密







