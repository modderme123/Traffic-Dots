var w = window.innerWidth,
    h = window.innerHeight;
var slider = document.getElementById("slider");
var pull = false;
var nodes = d3.range((w / 20) * (h / 20) / 4).map(function() {
    return {
        radius: 10 + Math.random() * 2.5
    };
});
var color = d3.scale.category10();

var force = d3.layout.force()
    .gravity(0)
    .charge(function(d, i) {
        return i ? 0 : 0;
    })
    .nodes(nodes)
    .size([w, h]);

var root = nodes[0];
root.radius = 0;
root.fixed = true;

force.start();

var svg = d3.select("#body")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .attr("id","svg");

for (var j = 10; j < w + 10; j += 20) {
    svg.append("svg:line")
        .attr("x1", j)
        .attr("y1", 10)
        .attr("x2", j)
        .attr("y2", Math.round(h / 20) * 20 - 10)
        .style("stroke", "lightgrey")
        .style("stroke-width", 0.5);
}
for (var j = 10; j < h + 10; j += 20) {
    svg.append("svg:line")
        .attr("x1", 10)
        .attr("y1", j)
        .attr("x2", w - 10)
        .attr("y2", j)
        .style("stroke", "lightgrey")
        .style("stroke-width", 0.5);
}

svg.selectAll("circle")
    .data(nodes.slice(1))
    .enter().append("svg:circle")
    .attr("r", function(d) {
        return d.radius - 2;
    })
    .style("fill", function(d, i) {
        //d.colr=i%4;
        return color(i % 4);

    });

force.on("tick", function(e) {
    var q = d3.geom.quadtree(nodes),
        i = 0,
        n = nodes.length;

    while (++i < n) {

        q.visit(collide(nodes[i]));
    }
    for(var m=0;m<10;m++){
    q = d3.geom.quadtree(nodes),
        i = 0,
        n = nodes.length;

    while (++i < n) {

        q.visit(collide(nodes[i]));
    }
    }
    

    svg.selectAll("circle")
        .attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        });
});

function brownian() {
    var i = 0,
        n = nodes.length;

    while (++i < n) {
        nodes[i].x = Math.max(Math.min(nodes[i].x, w - 10), 10);
        nodes[i].y = Math.max(Math.min(nodes[i].y, h - 10), 10);
        nodes[i].x = nodes[i].x / 100 * 95 + (Math.round(nodes[i].x / 20 + 0.5) * 20 - 10) / 100 * 5;
        nodes[i].y = nodes[i].y / 100 * 95 + (Math.round(nodes[i].y / 20 + 0.5) * 20 - 10) / 100 * 5;
        if (Math.random() < 0.001) {
            nodes[i].vx = Math.random() < 0.5 ? 1 : -1;
        }
        if (Math.random() < 0.001) {
            nodes[i].vy = Math.random() < 0.5 ? 1 : -1;
        }
        if (nodes[i].vx) {
            nodes[i].x = nodes[i].x + nodes[i].vx;
            nodes[i].vx = nodes[i].vx * 0.9;
        }
        if (nodes[i].vy) {
            nodes[i].y = nodes[i].y + nodes[i].vy;
            nodes[i].vy = nodes[i].vy * 0.9;
        }
    }
    force.resume();
}
svg.on("mousemove", function() {
    var p1 = d3.svg.mouse(this);
    root.px = p1[0];
    root.py = p1[1];
    if (pull === false) {
        force = force.charge(function(d, i) {
            return i ? 0 : 0;
        });

    } else {
        force = force.charge(function(d, i) {
           
            return i ? 0 : slider.value;
        });
    }
    force.start();
    force.resume();
});
svg.on("mousedown", function() {
    var p1 = d3.svg.mouse(this);
    root.px = p1[0];
    root.py = p1[1];
    pull = true;
    force = force.charge(function(d, i) {
        
        return i ? 0 : slider.value;
    });
    force.start();
    force.resume();
});
svg.on("mouseup", function() {
    var p1 = d3.svg.mouse(this);
    root.px = p1[0];
    root.py = p1[1];
    pull = false;
    force = force.charge(function(d, i) {
        return i ? 0 : 0;
    });
    force.start();
    force.resume();

});
svg.on("mouseleave", function() {
    var p1 = d3.svg.mouse(this);
    root.px = p1[0];
    root.py = p1[1];
    pull = false;
    force = force.charge(function(d, i) {
        return i ? 0 : 0;
    });
    force.start();
    force.resume();
});
document.getElementById("svg").onwheel = function(e){
    e.preventDefault();
    var event = window.event || e;
    var delta = 0;
    e.preventDefault();
    if (e.deltaY) { // FireFox 17+ (IE9+, Chrome 31+?)
        delta = -e.deltaY;
    } else if (e.wheelDelta) {
        delta = e.wheelDelta || -e.detail;
    }
    delta = Math.max(-1, Math.min(1, (delta)));
    slider.value -= (delta*500);
    console.log(delta);
};
function collide(node) {
    var r = node.radius ,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = node.radius + quad.point.radius;
            if (l < r ) {
                l = (l - r) / l * 0.5;
                node.x -= x *= l;
                node.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
            }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
}
window.setInterval(brownian, 10);
