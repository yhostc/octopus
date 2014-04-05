 // create pool with priorityRange of 3
 // borrowers can specify a priority 0 to 2
 var pool = poolModule.Pool({
     name     : 'mysql',
     create   : function(callback) {
         // do something
     },
     destroy  : function(client) { 
         // cleanup.  omitted for this example
     },
     max      : 10,
     idleTimeoutMillis : 30000,
     priorityRange : 3
 });

 // acquire connection - no priority - will go at end of line
 pool.acquire(function(err, client) {
     pool.release(client);
 });

 // acquire connection - high priority - will go into front slot
 pool.acquire(function(err, client) {
     pool.release(client);
 }, 0);