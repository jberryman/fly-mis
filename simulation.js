// r = radius of broadcast range
// rv = radius of node, visually
//
// set random paoints on canvas, removing if any overlap, e.g. with rv*2
// for each node get other nodes within radius r
// pass this to a new Network()

// VISUALS:
// --------
// draw active nodes in blue (maybe)
// draw light gray lines connecting nodes in a graph
// nodes "bounce" red (then fade to lighter red on broadcast), 
//    turn red and glow when in MIS
//    broadcast sends out a fuzzy ring that fades as it expands
// inactive nodes fade to gray



function distance(xy1,xy2){
    return Math.sqrt(Math.pow(xy2[0] - xy1[0] ,2) + Math.pow(xy2[1] - xy1[1], 2));
}


// do everything that happens in that canvas here:
Raphael.fn.simulateMIS = function(n){

    var p = this,
        h = p.height,
        w = p.width;
    
    // constants:
    var nodeRadius = 10,
        broadcastRange = 100;

    // get n random coordinates
    var coords = [];
    while(coords.length < n){
        var x = Math.round(Math.random() * w),
            y = Math.round(Math.random() * h);
        // keep nodes away from edges:
        if (x < nodeRadius || (x+nodeRadius) > w || (y+nodeRadius) > h || y < nodeRadius) continue;
        
        // make sure nothing overlaps, and add some breathing room
        var overlaps = $.grep(coords, function(xy1){
            return (distance(xy1, [x,y]) < (nodeRadius * 2 + 5));
        });
        if(overlaps.length === 0) coords.push([x,y]);
    }

    // Build an adjacency list from our coordinates
    var adjList = [];
    $.each(coords , function(nd_id, xy){
        var adj = [];
        $.each(coords , function(ndN_id, xyN){ 
            if(distance(xy,xyN) <= broadcastRange) adj.push(ndN_id);
        });
        adjList.push(adj);
    });

    // TEST: add n circles to the paper at coordinates, showing links:
    $.each(adjList, function(nd_id, nbrs){
        var xy = coords[nd_id];
        p.circle(xy[0] , xy[1] , nodeRadius);
    });

    //return netwk;
};


$(function(){
    paper = Raphael("paper", $("#paper").width(), $("#paper").height());


// bind all the stuff that happens outside the canvas here:
});
