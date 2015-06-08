var DemoPlugin = function(rootHtml) {
  this.rootHtml = rootHtml
};

module.exports = DemoPlugin;

var isCss = function(module){
  return module._source && module._source._value && 
         module._source._name.indexOf('.css') > -1;
};

var isContent = function(module){
  return module._source && module._source._value && 
         module._source._name.indexOf('.css') === -1;
};

var getContentHash = function(compilation){
  return compilation.chunks.reduce(function(contentHash, chunk){
    var modules = chunk.modules;
    var content = modules.reduce(function(total, m){
      if(isContent(m)){
        total += m._source._value;
      }

      return total;
    }, "");

    contentHash[chunk.name] = content;
    return contentHash;
  }, {});
};

var getCssModules = function(modules){
  return modules.filter(function(module){
    return isCss(module);
  });
};

DemoPlugin.prototype.apply = function(compiler) {
  var chunkContent;
  var cssModules;

  compiler.plugin('this-compilation', function(compilation) {
    compilation._purifycss_callback = function(callback){
      if(cssModules.length === 0){
        return callback();
      }

      var nextModule = cssModules.pop();
      compilation._purifycss_content = '';

      nextModule.chunks.forEach(function(chunk){
        compilation._purifycss_content += chunkContent[chunk.name] + ' ';
      });

      compilation.rebuildModule(nextModule, function(err){
        if(err){
          console.log(err);
        }

        compilation._purifycss_callback(callback);
      });
    };

    compilation.plugin("optimize-tree",  function(chunks, modules, callback) {
      chunkContent = getContentHash(compilation);
      cssModules = getCssModules(modules);
      compilation._purifycss_callback(callback);
    });
  });
};
