
const WIDTH = 1200;
const HEIGHT = 800;

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

  World.actors.push(new FighterEmitterActor(World, ["good-guy", "attack-random"], ["bad-guy"], 200, 200));
  World.actors.push(new FighterEmitterActor(World, ["good-guy", "attack-random"], ["bad-guy"], 200, 600));
  World.actors.push(new FighterEmitterActor(World, ["good-guy", "attack-random"], ["bad-guy"], 200, 333));
  World.actors.push(new FighterEmitterActor(World, ["good-guy", "attack-random"], ["bad-guy"], 200, 466));
  
  World.actors.push(new FighterEmitterActor(World, ["bad-guy", "attack-random"], ["good-guy"], 1000, 200));
  World.actors.push(new FighterEmitterActor(World, ["bad-guy", "attack-random"], ["good-guy"], 1000, 600));
  World.actors.push(new FighterEmitterActor(World, ["bad-guy", "attack-random"], ["good-guy"], 1000, 333));
  World.actors.push(new FighterEmitterActor(World, ["bad-guy", "attack-random"], ["good-guy"], 1000, 466));

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

  setTimeout(tick, 1000 / 60);
}
