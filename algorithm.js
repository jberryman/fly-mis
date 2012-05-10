// ============================================================================
//  PRELIMINARIES
// ============================================================================

// this is the constant that was determined to provide reasonable assurance
// of a correct Maximal Independent Set:
var M = 34;

// We use the binary logarithm rounded up for the coin-flip probability function.
// In the paper whenever is written "log" they mean log base 2 rounded up, both
// in the coin-flip probability and round limits.
function log2(n) { return Math.ceil( Math.log(n) / Math.log(2) ) }


// ============================================================================
//  ALGORITHM / NETWORK DESCRIPTION
// ============================================================================

// initialize a network with an adjacency list describing the neighbor nodes 
// that each node can "hear". 
//
// NOTE: paper seems to assume undirected graph, not sure if same
//   properties hold if we pass a directed graph here; a network of nodes
//   with varying "broadcast ranges" would be one example of such a network.
function Network(adjList) { 
    var netwk = this;
    
    // The algorithm is almost completely described by the behavior of a Node
    // in the Network. However nodes must act in a synchronous manner; here we
    // represent synchronized variables as properties of the network (rather
    // than by, say, each individual node's accurate internal clock).
    //
    // These properties include the upper bound for nodes in the network (n),
    netwk.n = 0; 
    // ...and the upper bound on neighbors a node may have (D). Note, this can
    // be set to 'n' if unknown
    netwk.D = 0; 
    
    // At the network level, the algorithm proceeds...
    netwk.run = function(){
    // ...in log2(D) phases (i)...
        forPhase(0 , log2(netwk.D))
    // ...each consisting of M log2(n) simultaneous message exchange steps (j)
            .forStep(0 , M * log2(netwk.n),  function(){
                       netwk.exch1(); //...described below
                return netwk.exch2();  
        });
        return netwk;
    }

    // A node's broadcast probability is a function of the current phase (i),
    // and (D) so we consider it the third and final property of the Network:
    netwk.phase;  // i


    // Here we describe in detail the behavior of a single Node in the network:
    function Node() {
        var nd = this;

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
            // and the upper bound of neighbors a node may have in the network (D):
            var p = 1 / Math.pow(2 , log2(netwk.D) - netwk.phase);

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

        // The second exchange is a kind of signaling phase.
        nd.exch2 = function(){
            // If state (v) is still 1, broadcast and exit, joining MIS...
            if (nd.v === 1) {
                nd.broadcast();
                nd.exit("IN_MIS")
            }
        }

        // ...else, if we received any messages from nodes joining the MIS in
        // this exchange, then exit the algorithm not in the MIS:
        nd.exch2_ = function(){
        //  else ...
                if (nd.received) nd.exit("NOT_IN_MIS")
        };
        
        // IMPLEMENTATION DETAIL:
        nd.id = netwk.n++;  // nodes numbered from 0
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


    // initialize nodes from graph passed to Network() and make accessible (not
    // a safe interface):
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
            eve.off("signal_all.do.*" , does); 
        });


        return nd;
    });

    // a programmable delay for visualization purposes. in (ms)
    netwk.delay = 0;

    // Fake two nested 'for' loops, necessary since we need a delay between
    // runs of inner loop. This started as an attempt at a generally-useful
    // framework for loops with delay but I got fed-up:
    function forPhase(p_i,lim_o){
        netwk.phase = p_i;
        return { 
            forStep: function (s_i,lim_i,f){
                var lo_inner = s_i;
                function go(){
                    if ( f() ) return;
                    if (lo_inner < lim_i){
                        lo_inner++;
                        setTimeout(go, netwk.delay);
                    } else {
                        if(netwk.phase < lim_o){
                            netwk.phase++;
                            lo_inner = s_i;
                            go();
                        } else {
                            // done
                        }
                    }
                }
                go();
            }
        }
    }
}


// TODO: EVENTS TO KEEP TRACK OF PHASE / STEP AND EXCH1/2.
// ALSO, WHAT ABOUT VISUALIZING "HIGH" STATE OF NODE AFTER BROADCAST?
//
Network.prototype.exch1 = function(){
    eve("announce.exch1", this, this.phase, this.step); // for visuals

    eve("signal_all.do.exch1");
    // From my tests and understanding of the 'eve' library, these events are
    // synchronous, and so we can assume the entire chain of message passing
    // performed above should have completed before the following is executed:
    eve("signal_all.do.exch1_");
    // likewise below...
}

Network.prototype.exch2 = function(){
    eve("announce.exch2", this);

    eve("signal_all.do.exch2");
    eve("signal_all.do.exch2_");

    // if we don't have any more active nodes, then return false:
    var active = eve.listeners("signal_all.do.*");
    return (active.length === 0);
}