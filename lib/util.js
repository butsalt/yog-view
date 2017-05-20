var _ = module.exports = {};
var caller = require('caller');
var path = require('path');

_.mixin = function mixin(a, b) {
    if (a && b) {
        for (var key in b) {
            a[key] = b[key];
        }
    }
    return a;
};

_.tpl = function tpl(str, locals) {
    var code = "var p=[];" +

        "p.push('" +

        // Convert the template into pure JavaScript
        str
            .replace(/[\r\t\n]/g, " ")
            .split("<%").join("\t")
            // <% %>外出现的单引号需要被转义，否则会与js内的字符串声明冲突
            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
            // <%=this.val%>
            // ->
            // ', this.val, '
            .replace(/\t=(.*?)%>/g, "',$1,'")
            // <%开始，就是字符串的结束
            .split("\t").join("');")
            // %>结束，就是字符串的开始
            .split("%>").join("p.push('")
            // 将<% %>外出现的单引号转义成字符串内的单引号
            .split("\r").join("\\'") +

        "');return p.join('');";

    var fn = new Function(code);

    return locals ? fn.call(locals) : fn;
};

_.resolveEngine = (function() {
    // yog-view 项目目录。
    var root = path.dirname(path.dirname(caller()));

    return function resolveEngine(name) {
        if (typeof name === 'function'){
            return name;
        }

        var fn = _.tryResolve(name) || _.tryResolve(path.resolve(root, name));

        if (!fn) {
            throw new Error('Cant find View Engine ' + name);
        }

        return require(fn);
    };
})();

_.tryResolve = function tryResolve(module) {
    try {
        return require.resolve(module);
    } catch (e) {
        return undefined;
    }
};