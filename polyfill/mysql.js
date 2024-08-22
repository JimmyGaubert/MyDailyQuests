import Connection from 'mysql/lib/Connection.js';
import Pool from 'mysql/lib/Pool.js';
import PoolCluster from 'mysql/lib/PoolCluster.js';

promisify(Connection);
promisify(Pool);
promisify(PoolCluster);

function promisify(clazz){
    function hasCallbackArg(func){
        const args = func.toString().split(")")[0].split("(")[1].split(",").map(a => a.trim());
        return args.includes("callback") || args.includes("cb");
    }
    
    let functionNames = Object.keys(clazz.prototype);
    
    for(const functionName of functionNames){
        const func = clazz.prototype[functionName];
        if(!hasCallbackArg(func)) { continue };
    
        clazz.prototype[functionName] = function () {
            const cbIndex = arguments.length - 1;
            if(typeof arguments[cbIndex] === "function") { return func.apply(this, arguments) };

            return new Promise((resolve, reject) => {
                arguments[cbIndex + 1] = function (err, ...args) {
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


console.log(Connection.prototype.connect)