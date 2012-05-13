// VISUALS:
// --------
// draw active nodes in blue (maybe)
// draw light gray lines connecting nodes in a graph
// nodes "bounce" red (then fade to lighter red on broadcast), 
//    turn red and glow when in MIS
//    broadcast sends out a fuzzy ring that fades as it expands
// inactive nodes fade to gray
//
// TODO:
// -----
// Expose for tweaking in UI
//     - (M) 
//     - number of nodes (n)
//     - broadcast range of nodes
//     - netwk.delay



function distance(xy1,xy2){
    return Math.sqrt(Math.pow(xy2[0] - xy1[0] ,2) + Math.pow(xy2[1] - xy1[1], 2));
}

// constants. might want to vary based on paper size:
var nodeRadius = 10,
    broadcastRange = 100;

var activeColor = "white",
    notInMISColor = "blue",
    inMISColor = "red";


// TODO: why aren't namespaces working here?
// our nodes and edges:
Raphael.fn.node = function(xy){
    return this.circle(xy[0] , xy[1] , nodeRadius)
               .attr("fill", activeColor);
}
Raphael.fn.edges = function(edges){
    var edgeString = "";
    $.each(edges, function(i,e){
        edgeString+="M"+e[0][0]+","+e[0][1]+"L"+e[1][0]+","+e[1][1];
    });
    return this.path(edgeString)
               .attr({
                   "stroke": "white",
                   "stroke-width": 4
               });
}

// Node exit visuals:
Raphael.el.exits = function(inMIS){
    if (inMIS){
        this.stop().animate({
            "fill": inMISColor,
            "r": nodeRadius * 1.2
        },  50,
            function(){
                this.glow({"color": inMISColor});
        });
    } else{
        this.stop().animate({
            "fill": notInMISColor
        },  50);
    }
}

// Node broadcast visuals:
// TODO: we need 'broadcast' and 'received' events to alter different
//       properties (i.e. not just fill color) , since they happen
//       simultaneously
Raphael.el.broadcasts = function(delay){

    var nd = this,
        attrs = nd.attr(["cx","cy"]),
        blast = nd.paper.circle(attrs.cx,attrs.cy,broadcastRange)
                        .attr({
                            "stroke": "red",
                            "fill":   "red",
                            "opacity": 0.5
                         })
                        .animate({
                            "opacity": 0
                         }, delay,
                            "linear",
                            function(){
                                blast.remove();
                            }
                         );
    // make the broadcasting node give a little "bounce"
    nd.animate({
        "r": nodeRadius * 1.2 
    },  Math.round(delay * 0.25),
        "ease-out",
        function(){
            nd.animate({
                "r": nodeRadius
            },  Math.round(delay * 0.75),
                "bounce"
            );
        }
    );
}

Raphael.el.received = function(delay){
    var nd = this;
    nd.animate({
        "fill": notInMISColor
    },  Math.round(delay / 4),
        "linear",
        function(){
            nd.animate({       
                "fill": activeColor
            },  Math.round(delay * (3/4)),
                "linear"
            );
        }
    );
}

// do everything that happens in that canvas here:
Raphael.fn.simulateMIS = function(n){

    var p = this,
        h = p.height,
        w = p.width;
    
    // get n random coordinates
    var coords = [];
    while(coords.length < n){
        var x = Math.round(Math.random() * w),
            y = Math.round(Math.random() * h);
        // keep nodes away from edges:
        if (x < nodeRadius || (x+nodeRadius) > w || (y+nodeRadius) > h || y < nodeRadius) continue;
        
        // make sure nothing overlaps, and add some breathing room
        var overlaps = $.grep(coords, function(xy1){
            return (distance(xy1, [x,y]) < (nodeRadius * 3));
        });
        if(overlaps.length === 0) coords.push([x,y]);
    }

    // Build an adjacency list from our coordinates. 
    var adjList = [];
    $.each(coords , function(nd_id, xy){
        var adj = [];
        $.each(coords , function(ndN_id, xyN){ 
            if(nd_id != ndN_id && distance(xy,xyN) <= broadcastRange) adj.push(ndN_id);
        });
        adjList.push(adj);
    });

    // add 'n' nodes to paper, w/ edges between:
    var nodeEls = [], // in index order corresponding to adjList/coords
        edges = [];
    $.each(adjList, function(nd_id, nbrs){
        var xy = coords[nd_id];
        nodeEls.push( p.node(xy) );
        $.each(nbrs, function(i,n_nd_id){
            if (nd_id < n_nd_id){ // only one path between nodes
                var xy2 = coords[n_nd_id];
                edges.push( [xy, xy2] );
            }
        });
    });
    // add adges as a single path element for speed:
    p.edges(edges).toBack();

    // initialize the Network!
    var netwk = new Network(adjList);

    // visuals for nodes' exits:
    eve.on("*.exits.*", function(){
        var m = eve.nt().split("."),
            nd = nodeEls[ m[0] ];
        if (m[2] === "IN_MIS"){
            nd.exits(true);
        } else{
            nd.exits(false);
        }
    });

    // visuals for broadcasts:
    eve.on("*.broadcasts", function(){
        var id = eve.nt().split(".")[0];   // TODO: actually 'this' is the node that broadcasted
        nodeEls[id].broadcasts(netwk.delay);         
    });
    eve.on("*.received", function(){
        var id = eve.nt().split(".")[0];
        nodeEls[id].received(netwk.delay);
    });

    return netwk;
};

// keep track of steps, and listen for phases in the exch step events, updating
// visuals. This could be improved.
var step,
    phase;
eve.on("announce.exch1", function(ph){
    if (ph !== phase) { // started new phase
        step = 0; 
        phase = ph;
        // adjust visuals for broadcast probability:
        //console.log("probability changed/set to: "+this.broadcastProb());
    }
    // do stuff:
    //console.log(phase,step);
});
eve.on("announce.exch2", function(){
    // do stuff:
    //console.log(phase,step);
    step++;
});


$(function(){
    paper = Raphael("paper", $("#paper").width(), $("#paper").height());

    // bind all the stuff that happens outside the canvas here:
});
