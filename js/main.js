
var time_resolution = 10;
var frame_resolution = 1;
var billboard;
var billboards = [];

var lastDay = 300;

var spinner;

var canvasWidth = 1200, canvasHeight = 800;
var selectBox;
var time, time_start = Date.now();
var cameraTrack = [];
var highlightedLine = null;
var nsamples;

var renderer, scene, camera;
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000 );
camera.position.z = 0;
camera.rotation.x = -30 * Math.PI/180;
camera.position.y = 20;

renderer = new THREE.WebGLRenderer();
renderer.setSize( canvasWidth, canvasHeight );
renderer.setClearColor( 0x111111, 1);

document.body.appendChild( renderer.domElement );
var stats = new Stats();
document.body.appendChild( stats.dom );

var geometry = new THREE.SphereGeometry( 1, 64, 64);
var material = new THREE.MeshBasicMaterial( { color: 0xaa11bb } );
var obj3d = new THREE.Mesh( geometry, material );
obj3d.position.x = 5;
obj3d.position.z = -10;

scene.add( obj3d );

var lineMaterial = new THREE.LineBasicMaterial({
    color: 0xaaaabb
});

var lineGeometry = new THREE.Geometry();
var distanceBetweenTiers = 200;
var cameraVerticalOffset = 0.1 * distanceBetweenTiers;

var verticalScale = d3.scalePow()
    .domain([1, 4])
    .rangeRound([0, -distanceBetweenTiers])
    ;

var timeScale = function(season, day) {
    return -(300 * (+season - 1995) + day);
};

var rankScale = d3.scalePow()
    .domain([1, 24])
    .rangeRound([0, 23*5])
;

camera.position.x = rankScale(12.5) ;

var lineGeometries = [];
var mergeGeometry = new THREE.Geometry();
var teamToTier = {};
var allTeams = [];


function loadData(data) {

    spinner.stop();
    var vx, vy, vz;

    _.forOwn(data, function(v, k) {
        allTeams.push(k);
    });

    allTeams.forEach(function(k) {
        teamToTier[k] = {};
        var lg = new THREE.Geometry();

        var vxold, vyold, vzold;

        data[k].forEach(function(d, i) {

            if (+d.currentday == lastDay) {
                teamToTier[k][d.Season] = {tier: d.tier, finalRank: d.rank};
            }

            vz = timeScale(d.Season, d.currentday);
            vy = verticalScale(d.tier);
            vx = rankScale(+d.rank);

            if (i === 0) {
                vxold = vx;
                vyold = vy;
                vzold = vz;
                return ;
            }

            var lineSegment =
                new THREE.LineCurve3(
                    new THREE.Vector3(vxold, vyold, vzold),
                    new THREE.Vector3(vx, vy, vz)
                );

            if (Math.abs(vy - vyold) > 1e-2) {
                nsamples = 256;
            } else {
                nsamples = 2;
            }
            var pointsArray = lineSegment.getPoints(nsamples);

            pointsArray.forEach(function(p) {
                lg.vertices.push(
                    new THREE.Vector3(p.x, p.y, p.z)
                );
            });

            vxold = vx;
            vyold = vy;
            vzold = vz;

        });

        lineGeometries[k] = lg;
        var line = new THREE.Line( lg, lineMaterial );
        mergeGeometry.merge(line.geometry, line.matrix);
    });

        selectBox = document.getElementById("teamSelect");
        selectBox.style.position = 'fixed';
        selectBox.style.width = 100;
        selectBox.style.height = 100;
        selectBox.style.backgroundColor = "white";
        selectBox.innerHTML = "hi there!";
        selectBox.style.top = 20 + 'px';
        selectBox.style.left = 900 + 'px';

        allTeams.forEach(function(team) {
            var option = document.createElement("option");
            option.text = team;
            option.value = team;
            selectBox.add(option);
        });

    $(document).on('change', '#teamSelect', function(e) {
        var selectedTeam = this.options[e.target.selectedIndex].text;
        console.log(selectedTeam);
        onTeamSelectChange(selectedTeam);
    });

    document.body.appendChild(selectBox);

    var mergeMesh = new THREE.Line(mergeGeometry, lineMaterial);
    scene.add( mergeMesh );
    renderer.render(scene, camera);
}


function onTeamSelectChange(value) {
    main(value);
}


var coloredLineMaterial = new THREE.LineBasicMaterial({
    color: 0xffeda0,
    linewidth: 10
});

function main(theTeam) {

    if (highlightedLine) {
        var g = highlightedLine.geometry;
        var m = highlightedLine.material;

        scene.remove(highlightedLine);
        g.dispose();
        m.dispose();
         billboards.forEach(function(billboard) {
             var g = billboard.geometry;
             var m = billboard.material;
             scene.remove(billboard);
             g.dispose();
             m.dispose();
         })
    }

    lineGeometry = lineGeometries[theTeam];

    cameraTrack = [];

    for(var i=0; i<lineGeometry.vertices.length; i += time_resolution) {
        var dy;
        if (i + time_resolution < lineGeometry.vertices.length) {
            dy = lineGeometry.vertices[i+time_resolution].y - lineGeometry.vertices[i].y;
        } else {
            dy = 0.0;
        }

        var v;
        if ( Math.abs(dy) > 1e-2) {
            for (var j = 0; j < time_resolution; j++ ) {
                v = lineGeometry.vertices[i + j];
            }
        } else {
            v = lineGeometry.vertices[i];
        }
        cameraTrack.push(new THREE.Vector3(v.x, v.y + cameraVerticalOffset, v.z));
    }

    highlightedLine = new THREE.Line(lineGeometry, coloredLineMaterial);

    scene.add(highlightedLine);
    console.log(lineGeometry.vertices.length);

    var idx = 0;
    var frameCount = 0;
    function render() {
        time = (Date.now() - time_start)/1000;
        if (frameCount % frame_resolution === 0) {
            var v = cameraTrack[idx];
            camera.position.z = v.z;
            camera.position.y = v.y + 10;
            idx += 1;
        }
        frameCount += 1;

        billboards.forEach(function(billboard) {
            billboard.lookAt(camera.position);
        });

        renderer.render(scene, camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
        stats.update();
    }

    function addPlane(params) {
        var canvas1 = document.createElement('canvas');
        var context1 = canvas1.getContext('2d');
        context1.font = "18px Arial";
        context1.fillStyle = "rgba(255,255,255,0.95)";

        context1.fillText(params.team, 0, 20);
        context1.fillText(params.season, 0, 40);
        context1.fillText(params.tier + ' : ' + params.finalRank, 0, 60);

        // canvas contents will be used for a texture
        var texture1 = new THREE.Texture(canvas1);
        texture1.needsUpdate = true;

        var material1 = new THREE.MeshBasicMaterial( {color: 0xffffff, map: texture1, side:THREE.DoubleSide } );
        material1.transparent = true;

        var geometry = new THREE.PlaneGeometry(80, 60, 32, 32);

        billboard = new THREE.Mesh(geometry, material1);
        billboard.position.y = params.v.y;
        billboard.position.z = params.v.z;
        billboard.position.x = params.v.x;
        billboards.push(billboard);
        scene.add(billboard);
    }

    function makeBillboards(theTeam) {
        var teamData = teamToTier[theTeam];
        console.log('teamData', teamData);
        _.forOwn(teamData, function(d, season) {
            addPlane({team: theTeam,
                season: season,
                tier: d.tier,
                finalRank: d.finalRank,
                v: {x: rankScale(30),
                    y: verticalScale(d.tier) +0.0*distanceBetweenTiers,
                    z: timeScale(parseInt(season) + 1, 0)}});
        })

    }

    console.log("teamToTier", teamToTier);
    makeBillboards(theTeam);
    animate();
}

var opts = {
    lines: 13 // The number of lines to draw
    , length: 28 // The length of each line
    , width: 14 // The line thickness
    , radius: 42 // The radius of the inner circle
    , scale: 1 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#f11' // #rgb or #rrggbb or array of colors
    , opacity: 0.6 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1 // Rounds per second
    , trail: 60 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '50%' // Top position relative to parent
    , left: '50%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
};

var target = document.getElementById('container');
spinner = new Spinner(opts).spin(target);
$.getJSON('../data/engsoccerdataCumulativeStandingsGroupedByTeam.json', loadData);

