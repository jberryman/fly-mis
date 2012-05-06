// this is the constant that was determined to provide reasonable assurance
// of a correct Maximal Independent Set:
var M = 34;

// We use the binary logarithm rounded up for the coin-flip probability function.
// In the paper whenever is written "log" they mean rounded up, both in the
// coin-flip probability and round limits.
function log2(n) { return Math.ceil( Math.log(n) / Math.log(2) ) }


// ============================================================================
//  ALGORITHM / NETWORK DESCRIPTION
// ============================================================================

// initialize a network with an adjacency list describing the neighbor nodes 
// that each node can "hear":
function Network(adjList) { 
    var netwk = this;

    // The algorithm is parameterized by two properties of the network: the
    // upper bound for nodes in the network (n), and the upper bound on
    // neighbors a node may have (D). 
    // (These will be kept up to date as nodes are added during initialization)
    netwk.D = 0; 
    netwk.n = 0; 

    // The algorithm proceeds in log2(D) phases...
    netwk.phase = 0;  // i
    // ...each consisting of (M log2(n)) message exchange steps...
    netwk.step = 0;   // j

    // ...where the probability that a node broadcasts is a function of (i) and
    // (D), with the probability of a node entering the MIS increasing with
    // each phase (see Node definition above).
    netwk.run = function(){
        for ( null; netwk.phase != log2(netwk.D); netwk.phase++ ) {
            for ( null; netwk.step != (M * log2(netwk.n)); netwk.step++ ) {
                netwk.exch1();
                netwk.exch2();
            }
        }
    }

    // The algorithm is almost completely described by the behavior of a Node
    // in the Network. However nodes must act in a synchronous manner; here we
    // represent synchronized variables as properties of the network (rather
    // than by, say, each individual node's internal clock).
    function Node() {
        var nd = this;
        nd.id = netwk.n++;  // nodes numbered from 0

        // a node has a "receiver" bit that is flipped to a high state (true)
        // when a message is received and can be reset. This implies our node 
        // cannot count the messages it has received, nor identify the sender:
        nd.received = false;

        // a node needs to keep one bit of state, which is set to 1 everytime
        // it broadcasts, and reset to 0 if a message is received after the
        // first exchange round. 
        nd.v; 


        // --------------------------------------------------------------------
        //  FIRST MESSAGE EXCHANGE 
        // --------------------------------------------------------------------
        //
        // IMPLEMENTATION NOTE: it is necessary to break up the two "message
        //   exchange" steps of each phase each into two phases, the second of
        //   which (named with an appended underdash) must take place _after_
        //   all messages have been sent. That is nodes must perform four
        //   discrete, synchronized steps.


        // The first exchange of each phase has nodes simultaneously
        // broadcasting to their neighbors according to our probability
        // function:
        nd.exch1 = function(){
            // initialize 'v' to zero:
            nd.v = 0;

            // the broadcast probability is a function of the current phase (i)
            // and the upper bound of neighbors a node may have in the network:
            var p = 1 / Math.pow(2 , log2(netwk.maxNeighbors) - netwk.phase);

            // return true and increment 'v' if we're broadcasting:
            if ( Math.random() <= p ){ 
                nd.v++;
                nd.broadcast();
            }
        }

        // if we received any messages in this exchange, reset state (v) to 0
        nd.exch1_ = function(){
            if (nd.received) { 
                nd.v = 0;
            }
            nd.received = false; // reset receiver
        }
       

        // --------------------------------------------------------------------
        //  SECOND MESSAGE EXCHANGE 
        // --------------------------------------------------------------------

        // the second exchange is a kind of signaling phase 
        nd.exch2 = function(){
            // if the state is still 1, then broadcast to neighbors and exit,
            // joining the MIS:
            if (nd.v === 1) {
                nd.broadcast();
                nd.exit("IN_MIS")
                return true; // node finished
            }
            return false; 
        }

        // else, if we weren't joining the MIS and received any messages this
        // exchange, then exit the algorithm not in the MIS:
        nd.exch2_ = function(){
        //  else ...
                if (nd.received) {
                    nd.exit("NOT_IN_MIS")
                    return true; // node finished
                }
                return false;
        };
    };


    // ========================================================================
    // IMPLEMENTATION DETAILS:
    // ========================================================================

    // we use Raphael's built-in 'eve' event library for message-passing:
    Node.prototype.broadcast = function(){
        var nd = this;
        eve( nd.id+".broadcasts" , nd );
    };

    Node.prototype.exit = function(ex_status){
        var nd = this;
        eve( nd.id+".exits."+ex_status , nd);
    };


    // Finally, nitialize nodes from graph passed to Network() and make
    // accessible (not a safe interface):
    netwk.nodes = $.map(adjList, function(neighbors,i){
        var nd = new Node();
        
        // keep the 'D' parameter current. 'n' is updated by Node.
        netwk.D = Math.max(netwk.D, neighbors.length);

        // a node needs to "hear" each of its neighbors.
        function hears(){ nd.received = true; }

        $.each(neighbors, function (i,nbr){
            eve.on( nbr+".broadcasts", hears );
        });
        
        // we'll also use events to signal that all nodes should perform an
        // exchange step. Eve is actually just a global queue so nothing is 
        // done asynchronously, but this would still work of events triggered
        // were non-deterministic:
        function does(){ 
            // get exchange method name we globbed, and run it directly. (a bit
            // of a hack, sorry)
            var exch = eve.nt().split(".").pop();
            nd[exch]();
        }
        eve.on("signal_all.do.*" , does);
        
        // stop listening to any broadcasts from neighbors, and stop listening
        // to signals, when this node exits (either in MIS or not):
        eve.on( nd.id+".exits.*" , function(){ 
            eve.off("*.broadcasts" , hears) 
            eve.off("signal_all.do.*" , does); // NOTE: this lets us use eve.listeners() to see how many are active
        });


        return nd;
    });
}



Network.prototype.exch1 = function(){
    eve("signal_all.do.exch1");
    // From my tests and understanding of the 'eve' library, these events are
    // synchronous, and so we can assume the entire chain of message passing
    // performed above should have completed before the following is executed:
    eve("signal_all.do.exch1_");
    // likewise below...
}

Network.prototype.exch2 = function(){
    eve("signal_all.do.exch2");
    eve("signal_all.do.exch2_");
}

// TODO: consider netwk.runStep() for debugging
