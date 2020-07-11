// class pub/sub manager for event-driven approach

class PubSubManager {

    // constructor creating empty list
    // of subscribers
    constructor() {
        this.subscribers = [];
        this.lastId = 0; 
    }

    msg_to_str(message) {
        var str_obj = '';
        for (var key in message) {
            if (str_obj.length > 0) {
                str_obj += ', ';
            }
            str_obj += key + ' -> ' + message[key];
        }
        return '(' + str_obj + ')';
    }

    // method to publish a message for a topic
    // topic is a string
    // message is an object {}
    publish(topic, message){
        console.log('Publishing message ' +  this.msg_to_str(message) + ' for topic ' + topic);
        for (var index in this.subscribers) {
            if (this.subscribers[index].topic == topic) {
                console.log('Message for topic ' + topic + ' received by subscriber ' + this.subscribers[index].id)
                this.subscribers[index].callback(message);
            }
        }
    }

    // method to subscribe to a topic
    // topic is a string
    // callback is a callback function with a single parameter message
    // the method return a subscriber id
    subscribe(topic, callback){
        this.lastId++;
        this.subscribers[this.subscribers.length] = {
            id: this.lastId,
            topic: topic,
            callback: callback
        }
        console.log('Created new subscriber for topic ' + topic + ' with id ' + this.lastId);
        return this.lastId;
    }

    // method to unsubscribe
    // subscriber_id is an int
    // the method return true if successfully unsubscribed or false otherwise
    unsubscribe(subscriber_id) {
        for (var index in this.subscribers){
            if (this.subscribers[index].id == subscriber_id) {
                console.log('Unsubscribing subscriber with id ' + subscriber_id + ' for topic ' + this.subscribers[index].topic);
                this.subscribers.splice(index,1);
                return true;
            }
        }

        return false;
    }
}