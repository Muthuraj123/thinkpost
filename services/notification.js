var supabase = require('../_helpers/config');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com');

async function getNotifications(req, res, next) {
    const userId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('Requested')
            .select('id, requestedFrom, requestedTo, accepted,created_at')
            .eq('requestedTo', `${userId}`)
            .eq('accepted', false);

        let newData = [];
        for (let i = 0; i < data.length; i++) {
            const { data: data1, error: error1 } = await supabase
                .from('User')
                .select('id, name, imageUrl')
                .eq('id', data[i].requestedFrom);

            let newData1 = { requestedId: data[i].id, userName: data1[0].name, userId, imageUrl: data1[0].imageUrl, requestedFrom: data[i].requestedFrom, requestedTo: data[i].requestedTo, requestedTime: data[i].created_at };
            newData.push(newData1);
        }

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(newData);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function accepted(req, res, next) {
    const { data: data1, error } = await supabase
        .from('Requested')
        .update({ accepted: true })
        .eq('id', req.body.data.requestedId);

    let data = req.body.data;

    if (data.requestedFrom == data.userId) {
        client.publish(`request/post/${data.requestedTo}`, JSON.stringify({ type: 'notification', fun: 'notification', post: { userId: data.userId } }));
    }
    if (data.requestedTo == data.userId) {
        client.publish(`request/post/${data.requestedFrom}`, JSON.stringify({ type: 'notification', fun: 'notification', post: { userId: data.userId } }));
    }

    res.status(200).json({ data: req.body.data.requestedId });
}

module.exports = {
    getNotifications,
    accepted
};