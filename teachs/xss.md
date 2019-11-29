# xss

## 真实场景：

- 官网portal改版，赶进度，有些输入框使用的时候innerHtml
- 后台传给我们的字符串是dom元素有样式，需要我们显示

## 框架的解决方案

React: SetDangerouslyHTML https://zh-hans.reactjs.org/docs/dom-elements.html https://www.cnblogs.com/xianyulaodi/p/5038258.html
Angular 2: [innerHTML] https://angular.io/guide/security
Vue: v-html https://github.com/lynnic26/LynnNote/issues/1 https://blog.sqreen.com/xss-in-vue-js/

**能不用innerHTML就不要使用**

