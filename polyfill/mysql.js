import Connection from 'mysql/lib/Connection.js';
import Pool from 'mysql/lib/Pool.js';
import PoolCluster from 'mysql/lib/PoolCluster.js';

promisify(Connection);
promisify(Pool);
promisify(PoolCluster);

function promisify(clazz){
    function hasCallbackArg(func){
        const args = func.toString().split(")")[0].split("(")[1].split(",").map(a => a.trim());
        if(args.includes("callback")) { return args.indexOf("callback") };
        if(args.includes("cb")) { return args.indexOf("cb") };
        return -1;
    }
    
    let functionNames = Object.keys(clazz.prototype);
    
    for(const functionName of functionNames){
        const func = clazz.prototype[functionName];
        const cbIndex = hasCallbackArg(func);
        if(cbIndex === -1) { continue };
    
        clazz.prototype[functionName] = function () {
            if(arguments.length <= cbIndex) cbIndex = arguments.length - 1;
            if(typeof arguments[cbIndex] === "function") { return func.apply(this, arguments) };

            return new Promise((resolve, reject) => {
                arguments[cbIndex] = function (err, ...args) {
                    if(err) reject(err);
                    resolve(args);
                }
                func.apply(this, arguments);
            });
        }
    
        Object.defineProperty(clazz.prototype[functionName], 'name', {
            value: func.name,
            writable: false
        });
    }
}
