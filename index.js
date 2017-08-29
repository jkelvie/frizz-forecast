/**
 * Created by reycastaneda on 8/29/17.
 */
var request = require('request');


const frizzFactorArray = [{
    defaultResponse: "Dry, with a chance of straight hair",
    response: [
        "Straight hair don’t care.",
        "Hot dog! Go on, warm up that hair straightener.",
        "And a high chance of static electricity.",
        "Whip your straight hair back and forth.",
        "One does not simply straighten their hair every day. Only on days like today.",
        "I don’t always have straight hair, but when I do I check with Frizz Forecast."
    ],
    level: 15,
},
    {
        defaultResponse: "Low, with a small chance of frizzle",
        response: [
            "Hey girl, your hair is hardly frizzy at all today.",
            "Challenge accepted, frizz forecast.",
            "Don’t cry over frizzy hair.",
            "Don't worry. Frizz is temporary."
        ],
        level: 30,
    },
    {
        defaultResponse: "Partly frizzy",
        response: [
            "With enough hairspray, I think you’ll avoid a frizz-aster.",
            "To curl or not to curl. That is the question.",
            "The hair tie: Never leave home without it.",
            "Ermahgerd, what’s your hair going to do today?",
            "First world frizz problems.",
            "Make waves. Literally, make hair waves.",
            "Challenge accepted, mother nature."
        ],
        level: 40,
    },
    {
        defaultResponse: "Clear for curls",
        response: [
            "Go on, let your hair down. Today is perfect for curls. Yassss.",
            "Who run the world? Curls. Go ahead, get your curl on today.",
            "Awwwww yeah. Curly hair. Don’t care.",
            "Life is short. Let your curls out today.",
            "Love is in the hair. Today brings prime curls conditions.",
            "Curlies have more fun. Now, go out there and prove it.",
            "Big hair don’t care. I’m Amazon Alexa and I support this message.",
            "Footloose and frizz free."
        ],
        level: 60,
    },
    {
        defaultResponse: "Severe frizz warning",
        response: [
            "Sorry, I can’t hear you over the volume of your hair.",
            "Is your hair big today because it’s full of secrets?",
            "Can I call you Miss Frizzle?",
            "There's a 100 percent chance of a ponytail.",
            "I see a ponytail in your future.",
            "Take the necessary precautions, and go for a classic bun.",
            "How are you with updos?",
            "Let it fro. Let it fro. Let it fro.",
            "All’s fair in love and frizz.",
            "This frizz shall pass."
        ],
        level: 61,
    }
];

exports.handler = function (event, context) {
    var player = new FrizzForecast(event, context);
    player.handle();
};

var FrizzForecast = function (event, context) {
    this.event = event;
    this.context = context;
};

// Handles an incoming Alexa request
FrizzForecast.prototype.handle = function () {
    var requestType = this.event.request.type;
    // var userId = this.event.context ? this.event.context.System.user.userId : this.event.session.user.userId;

    if (requestType === "LaunchRequest") {
        this.say("Hello there this is your frizz forecast, ask me if you will have a good hair day!", "You can say what is my frizz forecast?");
    } else if (requestType === "IntentRequest") {
        var intent = this.event.request.intent;
        if (intent.name === "frizzForecast") {
            const consentToken = this.event.context ?
                this.event.context.System.user.permissions && this.event.context.System.user.permissions.consentToken :
                this.event.session.user.permissions && this.event.session.user.permissions.consentToken;
            const deviceId = this.event.context ?
                this.event.context.System.device && this.event.context.System.device.deviceId :
                "";
            this.getWeatherForecast(deviceId, consentToken);
        } else if (intent.name === "AMAZON.PauseIntent") {

        } else if (intent.name === "AMAZON.ResumeIntent") {

        }
    }
};

/**
 * Creates a proper Alexa response using Text-To-Speech
 * @param message
 * @param repromptMessage
 */
FrizzForecast.prototype.say = function (message, repromptMessage) {
    var response = {
        version: "1.0",
        response: {
            shouldEndSession: false,
            card: {
                "type": "AskForPermissionsConsent",
                "permissions": [
                    "read::alexa:device:all:address:country_and_postal_code"
                ]
            },
            outputSpeech: {
                type: "SSML",
                ssml: "<speak> " + message + " </speak>"
            },
            reprompt: {
                outputSpeech: {
                    type: "SSML",
                    ssml: "<speak> " + repromptMessage + " </speak>"
                }
            }
        }
    };
    this.context.succeed(response);
};

/**
 * Gets the frizz forecast ased on the current weather
 * @param deviceId
 * @param consentToken
 */
FrizzForecast.prototype.getWeatherForecast = function (deviceId, consentToken) {
    const currentContext = this.context;
    request.get('https://api.amazonalexa.com/v1/devices/' + deviceId + '/settings/address/countryAndPostalCode', {
        'auth': {
            'bearer': consentToken
        }
    }, function (error, response, body) {
        const country = body.countryCode || "CA";
        const zipCode = body.postalCode || "94016";
        const url = 'http://api.wunderground.com/api/4a9c079f1cdb5b80/conditions/q/' + country + '/' + zipCode + '.json';
        let userFactor;
        request(url, function (wuError, wuResponse, wuBody) {
            const parsed = JSON.parse(wuBody);
            const dewpoint = parsed.current_observation && parsed.current_observation.dewpoint_f;
            for (i = 0; frizzFactorArray.length; i++) {
                if (frizzFactorArray[i].level > dewpoint) {
                    userFactor = frizzFactorArray[i];
                    break;
                } else if (i === 4) {
                    userFactor = frizzFactorArray[i];
                }
            }
            const finalMessage = "Your frizz forecast for today is " + userFactor.defaultResponse + ", " + getRandomQuote(userFactor) + " the Temperature";
            console.log(finalMessage);
            var response = {
                version: "1.0",
                response: {
                    shouldEndSession: true,
                    outputSpeech: {
                        type: "SSML",
                        ssml: "<speak>" + finalMessage + "</speak>"
                    }
                }
            };
            currentContext.succeed(response);
        });
    });
};

function getRandomQuote(userFactor) {
    return userFactor.response[Math.floor(Math.random() * userFactor.response.length)];
}
