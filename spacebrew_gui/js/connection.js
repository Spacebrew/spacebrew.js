var sb;

function onRangeMessage(name, value){
  $("#"+name).slider('refresh', value);
};

function setup (){
  sb = new Spacebrew.Client(
          undefined, 
          getQueryString('name') || (getQueryString('id') ? ("SpaceGUI" + getQueryString('id')) : "Untitled SpaceGUI"),
          "GUI for sending and displaying SpaceBrew range messages.");
  sb.addPublish("slider1", "range", "500");
  sb.addPublish("slider2", "range", "500");
  sb.addSubscribe("slider1", "range");
  sb.addSubscribe("slider2", "range");
  sb.onRangeMessage = onRangeMessage;
  sb.connect();
};

$(window).on("load", setup);
