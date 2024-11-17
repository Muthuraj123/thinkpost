var supabase = require('../_helpers/config');
const fs = require('fs');
const cloudinary = require('./../_helpers/cloudinaryConfig');
const mqtt = require('mqtt');
// const client = mqtt.connect('mqtt://broker.hivemq.com');
const client = mqtt.connect('mqtts://broker.hivemq.com');

async function testing(req, res, next) {
    res.status(200).json({ message: 'hi' });
}

async function createUser(req, res, next) {
    const {
        name,
        email,
        password,
        uid
    } = req.body.data;

    if (req.body.data?.type == 'gmail') {
        const { data, error } = await supabase
            .from('User')
            .select('*')
            .eq('uid', `${uid}`)
            .single();

        if (data !== null) {
            res.status(200).json(
                {
                    status: "1",
                    data
                });
        } else {
            const { data, error } = await supabase
                .from('User')
                .insert([
                    { name: `${name}`, email: `${email}`, password: '', uid: `${uid}` }
                ])
                .select()

            if (error) {
                return res.status(400).json({
                    message: error.message
                });
            } else {
                res.status(200).json(
                    {
                        status: "1",
                        data
                    });
            }
        }
    } else {
        const { data, error } = await supabase
            .from('User')
            .insert([
                { name: `${name}`, email: `${email}`, password: `${password}`, uid: `${uid}` }
            ])
            .select()

        if (error) {
            return res.status(400).json({
                message: error.message
            });
        } else {
            res.status(200).json(
                {
                    status: "1",
                    data
                });
        }
    }
}

async function getUser(req, res, next) {
    const userId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('User')
            .select('*')
            .eq('uid', userId)
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function suggestedUsers(req, res, next) {
    const userId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('User')
            .select('id, name, email, uid, created_at, imageUrl')
            .neq('id', userId);

        const { data: data1, error: error1 } = await supabase
            .from('Requested')
            .select('id, created_at,requestedFrom,requestedTo,accepted')
            // .eq('accepted', false)
            .or(`requestedFrom.eq.${userId},requestedTo.eq.${userId}`);

        let newData = [];
        for (let i = 0; i < data?.length; i++) {
            for (let j = 0; j < data1.length; j++) {
                let ldata = null;
                if (((data1[j].requestedFrom == userId && data1[j].requestedTo == data[i].id) || (data1[j].requestedTo == userId && data1[j].requestedFrom == data[i].id))) {
                    ldata = {
                        id: data[i].id,
                        name: data[i].name,
                        imageUrl: data[i].imageUrl,
                        requested: true,
                        accepted: data1[j].accepted
                    }
                    newData.push(ldata);
                }
            }
        }

        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data1.length; j++) {
                let index = newData.findIndex((element) => (element.id == data[i].id));
                if (index == -1) {
                    let ldata = {
                        id: data[i].id,
                        name: data[i].name,
                        imageUrl: data[i].imageUrl,
                        requested: false,
                        accepted: false
                    }
                    newData.push(ldata);
                }
                break;
            }
        }

        if (newData.length === 0) {
            for (let i = 0; i < data.length; i++) {
                let ldata = {
                    id: data[i].id,
                    name: data[i].name,
                    imageUrl: data[i].imageUrl,
                    requested: false,
                    accepted: false
                }
                newData.push(ldata);
            }
        }

        if (error) {
            console.log(error.message);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json(newData);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function sendRequest(req, res, next) {
    const {
        requestedFrom,
        requestedTo
    } = req.body.data;

    const { data, error } = await supabase
        .from('Requested')
        .select('*')
        .or(
            `and(requestedFrom.eq.${requestedFrom},requestedTo.eq.${requestedTo}),and(requestedFrom.eq.${requestedTo},requestedTo.eq.${requestedFrom})`
        );

    if (data.length === 0) {
        const { data: data1, error: error1 } = await supabase
            .from('Requested')
            .insert([
                { requestedFrom: requestedFrom, requestedTo: requestedTo }
            ])
            .select('*')

        client.publish(`request/post/${requestedTo}`, JSON.stringify({ type: 'request', fun: 'request', post: { userId: requestedTo } }));

        if (error) {
            return res.status(400).json({
                message: error.message
            });
        } else {
            res.status(200).json(
                {
                    status: "1",
                    data: {
                        requestedTo
                    }
                });
        }
    } else {
        client.publish(`request/post/${requestedTo}`, JSON.stringify({ type: 'request', fun: 'request', post: { userId: requestedTo } }));
        res.status(200).json(
            {
                status: "1",
                data: {
                    requestedTo
                }
            });
    }
}

async function updateUser(req, res, next) {
    try {
        const file = req.file;

        if (file !== undefined) {
            const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
            });

            fs.unlinkSync(file.path);

            const { data, error } = await supabase
                .from('User')
                .update({ name: req.body.name, imageUrl: `${result.secure_url}` })
                .eq('id', req.body.userId)
                .select('id,name,imageUrl');

            if (error) {
                return res.status(400).json({
                    message: error.message
                });
            } else {
                res.status(200).json(
                    {
                        status: "1",
                        data: data[0]
                    });
            }
        } else {
            const { data, error } = await supabase
                .from('User')
                .update({ name: req.body.name })
                .eq('id', req.body.userId)
                .select('id,name,imageUrl');

            if (error) {
                return res.status(400).json({
                    message: error.message
                });
            } else {
                res.status(200).json(
                    {
                        status: "1",
                        data: data[0]
                    });
            }
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }
}

async function getFriends(req, res, next) {
    const userId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('User')
            .select('id, name, email, uid, created_at, imageUrl')
            .neq('id', userId);

        const { data: data1, error: error1 } = await supabase
            .from('Requested')
            .select('id, created_at,requestedFrom,requestedTo,accepted')
            .eq('accepted', true)
            .or(`requestedFrom.eq.${userId},requestedTo.eq.${userId}`);

        let newData = [];
        for (let j = 0; j < data1.length; j++) {
            if (data1[j].requestedFrom == userId) {
                let user = data.find(u => u.id === data1[j].requestedTo);
                newData.push({ userId: user.id, requestedId: data1[j].id, requestedFrom: data1[j].requestedFrom, requestedTo: data1[j].requestedTo, userName: user.name, imageUrl: user.imageUrl });
            }
            if (data1[j].requestedTo == userId) {
                let user = data.find(u => u.id === data1[j].requestedFrom);
                newData.push({ userId: user.id, requestedId: data1[j].id, requestedFrom: data1[j].requestedFrom, requestedTo: data1[j].requestedTo, userName: user.name, imageUrl: user.imageUrl });
            }
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

async function disconnectFriend(req, res, next) {
    const { requestedId, requestedTo } = req.body.data;

    const { data, error } = await supabase
        .from('Requested')
        .delete()
        .eq('id', requestedId);

    client.publish(`request/post/${requestedTo}`, JSON.stringify({ type: 'disconnect', fun: 'disconnect', post: { requestedId } }));

    if (error) {
        console.log(error.message);
        return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ requestedId });
}

async function getMessages(req, res, next) {
    const { requestedFrom, requestedTo } = req.body.data;

    const { data, error } = await supabase
        .from('Messages')
        .select('*')
        .or(`and(requestedFrom.eq.${requestedFrom},requestedTo.eq.${requestedTo}),and(requestedFrom.eq.${requestedTo},requestedTo.eq.${requestedFrom})`)

    const { data: data1, error: error1 } = await supabase
        .from('User')
        .select('*');

    for (let i = 0; i < data.length; i++) {
        if (data[i].requestedFrom === requestedFrom) {
            let user = data1.find(u => u.id === requestedFrom);
            data[i].userName = user.name;
            data[i].imageUrl = user.imageUrl;
            data[i].userId = user.id;
        }
    }

    if (error) {
        console.log(error.message);
        return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ data });
}

async function sendMessage(req, res, next) {
    const { requestedFrom, requestedTo, comment } = req.body.data;
    const { data, error } = await supabase
        .from('Messages')
        .insert([
            { requestedFrom: `${requestedFrom}`, requestedTo: `${requestedTo}`, message: `${comment}` }
        ])
        .select('*')

    const { data: data1, error: error1 } = await supabase
        .from('User')
        .select('*');

    for (let i = 0; i < data.length; i++) {
        if (data[i].requestedFrom === requestedFrom) {
            let user = data1.find(u => u.id === requestedFrom);
            data[i].userName = user.name;
            data[i].imageUrl = user.imageUrl;
            data[i].userId = user.id;
        }
    }

    client.publish(`request/post/${requestedTo}`, JSON.stringify({ type: 'message', fun: 'message', post: { data: data[0], userId: requestedFrom } }));

    res.status(200).json({ data });
}

module.exports = {
    testing,
    createUser,
    getUser,
    suggestedUsers,
    sendRequest,
    updateUser,
    getFriends,
    disconnectFriend,
    getMessages,
    sendMessage
};