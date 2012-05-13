// TODO:
// -----
// Expose for tweaking in UI
//     - (M) 
//     - number of nodes (n)
//     - broadcast range of nodes



function distance(xy1,xy2){
    return Math.sqrt(Math.pow(xy2[0] - xy1[0] ,2) + Math.pow(xy2[1] - xy1[1], 2));
}

// constants. might want to vary based on paper size:
var nodeRadius = 10,
    broadcastRange = 100;

var activeColor = "white",
    notInMISColor = "#5555FF",
    notInMISFlashColor = "#8888FF",
    inMISColor = "#FF3333";

// ----------------------------------------------------------------------------
// VISUAL STYLING
// ----------------------------------------------------------------------------

// TODO: why aren't namespaces working here?
// our nodes and edges:
Raphael.fn.node = function(xy){
    return this.circle(xy[0] , xy[1] , nodeRadius)
               .attr({
                   "fill": activeColor,
                   "stroke": "#555555"
               });
}
Raphael.fn.edges = function(edges){
    var edgeString = "";
    $.each(edges, function(i,e){
        edgeString+="M"+e[0][0]+","+e[0][1]+"L"+e[1][0]+","+e[1][1];
    });
    return this.path(edgeString)
               .attr({
                   "stroke": "white",
                   "stroke-width": 2
               });
}

// Node exit visuals:
Raphael.el.exits = function(inMIS){
    if (inMIS){
        this.stop().animate({
            "fill": inMISColor,
            "stroke": inMISColor,
            "r": nodeRadius * 1.5
        },  200);
    } else{
        this.stop().animate({
            "fill": notInMISColor,
            "stroke": notInMISColor
        },  200);
    }
}

// Node broadcast visuals:
Raphael.el.broadcasts = function(delay){
    var nd = this,
        attrs = nd.attr(["cx","cy"]),
        blast = nd.paper.circle(attrs.cx,attrs.cy,broadcastRange)
                        .attr({
                            "stroke": inMISColor,
                            "fill":   inMISColor,
                            "opacity": 0.3
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
        "r": nodeRadius * 1.5 
    },  Math.round(delay * 0.20),
        "ease-in",
        function(){
            nd.animate({
                "r": nodeRadius
            },  Math.round(delay * 0.70),
                "bounce"
            );
        }
    );
}

Raphael.el.received = function(delay){
    var nd = this;
    nd.animate({
        "fill": notInMISFlashColor
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

// ----------------------------------------------------------------------------
// RUNNING SIMULATION
// ----------------------------------------------------------------------------

// do everything that happens in that canvas here:
Raphael.fn.simulateMIS = function(n){

    var p = this,
        h = p.height,
        w = p.width;
    
    // get n random coordinates
    var coords = [];
    while(coords.length < n){
        var x = Math.round(Math.random() * w),
            y = Math.round(Math.random() * h),
            nrx2 = nodeRadius * 2;
        // keep nodes away from edges:
        if (x < nrx2 || (x+nrx2) > w || (y+nrx2) > h || y < nrx2) continue;
        
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
    $("body").append("<button onclick='var n = paper.simulateMIS(100); setTimeout(function(){n.run()},5000);'>");

    // bind all the stuff that happens outside the canvas here:
});
