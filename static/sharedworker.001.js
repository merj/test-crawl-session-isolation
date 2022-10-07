const browserInstances = [];
const messages = [];

// Listen for new messages and forward them to the instances
onconnect = function(e) {
  const port = e.ports[0];
  browserInstances.push(port);
  port.onmessage = function(event) {
    const message = event.data;
    messages.push(message);
    browserInstances.forEach(instance => {
      instance.postMessage(message);
    });
  }
}