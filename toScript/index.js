/**
 *  
 *  @desc: js压缩
 *  
 *  @author: qzzf1987@gmail.com
 * 
 *  @create: 2014-02-11 
 *  
 *  @last: 2014-02-12
 *
 *  实例:
 *  1. cd D:\MRzhang\MR-compress\toScript
 *  2. node index.js jspath
 *  
 *  [jspath]: 待压缩js文件的根目录, 压缩完成后的js文件都会存放在[jspath_min]目录下.
 *  
 *
 *  更新记录:
 *  1. 添加命令行解析, 解析获得文件目录夹
 *  2. 日志显式压缩条目
 *  
 *
 */


var uglifyJS = require('uglify-js'),
    dateFormat = require('dateformat'),
    walk = require('walk'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),

    mrUtils = require('../common/utils'),

    // 根据传参来读取
    fileRoot,

    // 收集的文件对象
    files = [],
    // 等待压缩文件数 
    restSize = 0,

    // 启动时间
    now = +new Date,

    banner = '/** 浙江电子口岸压缩脚本 author:zhangF(qzzf1987@gmail.com); time:' + dateFormat(now, 'yyyy-mm-dd HH:MM:ss') + ' **/\n'
;

// 采用uglify来执行压缩
function compressFile(file, callback){
    var start = +new Date,
        expend,
        result
    ;

    result = uglifyJS.minify(file);
    expend =  +new Date - start;

    console.log('压缩源文件:%s, 耗时:%d毫秒', file, expend);

    callback(result);
};


function writeCompressed(file, code){
    fs.writeFile(file, banner + code, function(err){
        if (err) throw err;
        restSize--;
        if(!restSize){
            console.log('所有%d个js文件已经压缩完成, 耗时%d毫秒!', files.length, (+new Date - now));
        }
    });
}


function compress(){
    // 压缩绑定的回调函数, 用于处理压缩结果
    function callback(fobj, result){
        fs.exists(fobj.target, function(exists){
            if(!exists){
                mkdirp.sync(fobj.target);
            }
            writeCompressed(path.join(fobj.target, fobj.name), result.code);
        });
    }

    if(files && files.length) {

        files.forEach(function(fobj){
            compressFile(path.join(fobj.src, fobj.name), callback.bind(null, fobj));
        });
        
        // compressFile(path.join(files[0].src, files[0].name), callback.bind(null, files[0]));

    }
};

// 遍历指定的目录, 并且收集所有js文件
function walkjs(){

    var options = {
            followLinks: false
        },
        walker
    ;

    fileRoot.forEach(function(root){
        walker = walk.walk(root, options);
    });


    // 完成时, 回调操作
    walker.on('end', function(){

        if(files.length){
            console.log('收集完成, 总共有%d个js需要进行压缩!', files.length);
            compress();
            return;
        }
        console.log('找不到任何需要压缩的js文件.[可能情况: 1: 路径不正确; 2. 无修改文件]');
    });


    walker.on('file', function(root, fileStat, next){

        var name = fileStat.name,
            base,
            dir,
            idx,
            srcFile,
            targetFile
        ;

        if(fileStat && fileStat.isFile() && path.extname(name) === '.js'){
            restSize++;
            fileRoot.some(function(rootDir){
                if(~(idx = root.indexOf(rootDir))){
                    dir = root.substring(idx + rootDir.length);
                    base = rootDir;
                    return true;
                }
            });

            // 判断源文件是否已经被压缩过, 且已经发生了变化
            srcFile = path.join(root, name);
            targetFile = path.join(base + '_min', dir, name);


            // 未被压缩, 或者已经发生了变化
            if( !fs.existsSync(targetFile) || mrUtils.hasChanged(srcFile, targetFile) ){
                files.push({
                    src: root,
                    target: path.dirname(targetFile),
                    name: name
                });
            }
        }

        next();
    });
}

// 解析传入的参数
function parseArgs(){
    var args = process.argv;
    fileRoot = args.slice(2);
}

parseArgs();

walkjs();
