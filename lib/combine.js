var Transform = require('stream').Transform;

module.exports = function (layer, settings) {
    var stream = new Transform();
    var bigpipe = layer.bigpipe;
    var isQuicklingMode = bigpipe && bigpipe.isQuicklingMode();
    var identify = layer.BIGPIPE_HOOK;

    // chain error
    stream.on('pipe', function (source) {
        source.on('error', this.emit.bind(this, 'error'));
    });

    stream._transform = function (chunk, encoding, done) {
        var output;

        if (isQuicklingMode){
            output = '';
        } else {
            if (settings.customFilter) {
                output = settings.customFilter(chunk.toString(), layer.getDepsInfo());
            } else {
                // 将页面依赖的静态资源replace到页面字符串上
                output = layer.filter(chunk.toString());
            }
        }

        var idx = identify ? output.indexOf(identify) : -1;
        var clouser = '';

        // bigpipe mode
        if (bigpipe && (~idx || isQuicklingMode)) {
            // 支持bigpipe
            // 且
            // 页面字符串上有bigpipe挂载点 或 是quickling请求

            if (~idx) {
                clouser = output.substring(idx + identify.length);
                output = output.substring(0, idx);
            }

            this.push(output);

            // bigpipe is a readable stream.
            return bigpipe

            // chain error.
            .on('error', stream.emit.bind(stream, 'error'))

            .on('data', function (chunk) {
                stream.push(chunk);
            })

            .on('end', function () {
                stream.push(clouser);
                done();
            });
        }

        this.push(output);
        return done();
    };

    return stream;
};
