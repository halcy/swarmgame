
const WIDTH = 800;
const HEIGHT = 600;

const World = {
  width: WIDTH,
  height: HEIGHT,
  main: null,
  actors: [],
};

$(main);
function main() {
  World.main = $("#main");
  World.main
    .css("width",  `${WIDTH}px`)
    .css("height", `${HEIGHT}px`);


  World.actors.push(new FighterEmitterActor(World, "good-guy", "bad-guy"));
  World.actors.push(new FighterEmitterActor(World, "bad-guy", "good-guy"));

  tick();
}


function tick() {

  var newActors = [];
  for(var i=0; i < World.actors.length; ++i){
    World.actors[i].tick(World);
    if(World.actors[i].alive){
      newActors.push(World.actors[i]);
    }
  }
  World.actors = newActors;

  setTimeout(tick, 1000 / 16);
}
