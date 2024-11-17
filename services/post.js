const cloudinary = require('./../_helpers/cloudinaryConfig');
const fs = require('fs');
var supabase = require('../_helpers/config');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com');

async function addPost(req, res, next) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
        });

        fs.unlinkSync(file.path);

        let imageType = file.mimetype.split('/')[0];

        const { data, error } = await supabase
            .from('Post')
            .insert([
                { userId: req.body.userId, fileUrl: `${result.secure_url}`, description: `${req.body.description}`, type: `${imageType}` }
            ])
            .select('id, userId, created_at, fileUrl,description,likes,type, User(id,name,imageUrl)')

        client.on('connect', () => {
            console.log('Connected to MQTT broker');
            client.subscribe(`request/post/${req.body.userId}`, (err) => {
                if (!err) {
                    console.log(`Subscribed to request/post/${req.body.userId}`);
                }
            });
        });

        const { data: data2, error: error2 } = await supabase
            .from('Requested')
            .select('id, requestedFrom, requestedTo, accepted')
            .or(`requestedFrom.eq.${req.body.userId},requestedTo.eq.${req.body.userId}`)
            .eq('accepted', true);

        await sendNotification(data2, req.body.userId, data[0], "add");

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
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }
}

async function getPosts(req, res, next) {
    const userId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('Post')
            .select('id, userId, created_at, fileUrl,description,likes,type, User(id,name,imageUrl)')
            .order('created_at', { ascending: false });

        const { data: data2, error: error2 } = await supabase
            .from('Requested')
            .select('id, requestedFrom, requestedTo, accepted')
            .or(`requestedFrom.eq.${userId},requestedTo.eq.${userId}`)
            .eq('accepted', true);

        let newData = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i].userId == userId) {
                newData.push(data[i]);
            } else {
                for (let j = 0; j < data2?.length; j++) {
                    if ((data[i].userId == data2[j].requestedFrom || data[i].userId == data2[j].requestedTo) && data2[j].accepted === true) {
                        newData.push(data[i]);
                    }
                }
            }
        }

        let tempData = await getLikes(newData, userId);

        if (error) {
            console.log(error.message);
            return res.status(400).json({ error: error.message });
        }

        if (error2) {
            console.log(error?.message);
            return res.status(400).json({ error: error2.message });
        }

        res.status(200).json(tempData);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getLikes(newData, userId) {
    let count = 0;
    for (let i = 0; i < newData.length; i++) {
        count++;
        const { data: data3, error: error3 } = await supabase
            .from('Likes')
            .select('*')
            .eq('postId', newData[i].id);

        const { data: data4, error: error4 } = await supabase
            .from('Likes')
            .select('*')
            .eq('postId', newData[i].id)
            .eq('userId', userId);

        const { data: data5, error: error5 } = await supabase
            .from('comments')
            .select('id')
            .eq('postId', newData[i].id);

        if (data3?.length > 0) {
            newData[i].likesCount = data3.length;
        } else {
            newData[i].likesCount = 0;
        }

        if (data4?.length > 0) {
            newData[i].isLiked = true;
        } else {
            newData[i].isLiked = false;
        }

        if (data5?.length > 0) {
            newData[i].totalComments = data5.length;
        } else {
            newData[i].totalComments = 0;
        }
    }

    if (count >= newData.length) {
        return new Promise((resolve, reject) => {
            const success = true;
            if (success) {
                resolve(newData);
            } else {
                reject("Something went wrong.");
            }
        })
    }
}

async function deletePost(req, res, next) {
    const id = req.params.id;

    try {
        const { data: data1, error: error1 } = await supabase
            .from('Likes')
            .delete()
            .eq('postId', id)

        const { data, error } = await supabase
            .from('Post')
            .delete()
            .eq('id', id)
            .select('id, userId, created_at, fileUrl,description,likes,type, User(id,name,imageUrl)')

        const { data: data2, error: error2 } = await supabase
            .from('Requested')
            .select('id, requestedFrom, requestedTo, accepted')
            .or(`requestedFrom.eq.${data[0].userId},requestedTo.eq.${data[0].userId}`)
            .eq('accepted', true);

        await sendNotification(data2, data[0].userId, data[0], 'delete');

        if (error) {
            console.log(error.message);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ id });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function editPost(req, res, next) {
    try {
        const file = req?.file;
        if (file) {
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
            });

            fs.unlinkSync(file.path);

            const { data, error } = await supabase
                .from('Post')
                .update({ description: req.body.description, fileUrl: `${result.secure_url}` })
                .eq('id', req.body.postId)
                .select('id,userId,description,fileUrl');



            const { data: data2, error: error2 } = await supabase
                .from('Requested')
                .select('id, requestedFrom, requestedTo, accepted')
                .or(`requestedFrom.eq.${data[0].userId},requestedTo.eq.${data[0].userId}`)
                .eq('accepted', true);

            await sendNotification(data2, data[0].userId, data[0], 'edit');



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
                .from('Post')
                .update({ description: req.body.description })
                .eq('id', req.body.postId)
                .select('id,userId,description,fileUrl');

            const { data: data2, error: error2 } = await supabase
                .from('Requested')
                .select('id, requestedFrom, requestedTo, accepted')
                .or(`requestedFrom.eq.${data[0].userId},requestedTo.eq.${data[0].userId}`)
                .eq('accepted', true);

            await sendNotification(data2, data[0].userId, data[0], 'edit');

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

async function likePost(req, res, next) {
    const {
        postId,
        userId
    } = req.body.data;

    const { data, error } = await supabase
        .from('Likes')
        .insert([
            { postId, userId }
        ]);

    const { data: data2, error: error2 } = await supabase
        .from('Requested')
        .select('id, requestedFrom, requestedTo, accepted')
        .or(`requestedFrom.eq.${userId},requestedTo.eq.${userId}`)
        .eq('accepted', true);

    await sendNotification(data2, userId, { postId }, 'like');

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    } else {
        res.status(200).json(
            {
                status: "1",
                data: {
                    postId
                }
            });
    }
}

async function unlikePost(req, res, next) {
    const {
        postId,
        userId
    } = req.body.data;

    const { data, error } = await supabase
        .from('Likes')
        .delete()
        .eq('postId', postId)
        .eq('userId', userId);

    const { data: data2, error: error2 } = await supabase
        .from('Requested')
        .select('id, requestedFrom, requestedTo, accepted')
        .or(`requestedFrom.eq.${userId},requestedTo.eq.${userId}`)
        .eq('accepted', true);

    await sendNotification(data2, userId, { postId }, 'unlike');

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    } else {
        res.status(200).json(
            {
                status: "1",
                data: {
                    postId
                }
            });
    }
}

async function testing(req, res, next) {
    io.emit('notification', { message: 'hi' });
    res.send({ status: 'Notification sent', message: 'hi' });
};

async function addComment(req, res, next) {
    const { postId, userId, comment } = req.body.data;

    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([
                { userId: userId, postId: postId, comment: `${comment}` }
            ])
            .select('id, postId,userId,created_at, comment, User(id,name,imageUrl)')

        const { data: data2, error: error2 } = await supabase
            .from('Requested')
            .select('id, requestedFrom, requestedTo, accepted')
            .or(`requestedFrom.eq.${userId},requestedTo.eq.${userId}`)
            .eq('accepted', true);

        await sendNotification(data2, userId, { postId }, 'comment');

        if (error) {
            console.log(error.message)
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }
}

async function getComments(req, res, next) {
    const postId = req.params.id;

    const { data, error } = await supabase
        .from('comments')
        .select('id,postId,userId,created_at, comment, User(id,name,imageUrl)')
        .eq('postId', postId)
        .order('created_at', { ascending: true });

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    } else {
        res.status(200).json(
            {
                status: "1",
                data: data
            });
    }
}

async function sendNotification(newData, userId, post, type) {
    let count = 0;
    for (let i = 0; i < newData.length; i++) {
        count++;
        if (newData[i].requestedFrom == userId) {
            if (type === 'add') {
                client.publish(`request/post/${newData[i].requestedTo}`, JSON.stringify({ type: 'post', fun: 'add', post }));
            }
            if (type === 'delete') {
                client.publish(`request/post/${newData[i].requestedTo}`, JSON.stringify({ type: 'post', fun: 'delete', post }));
            }
            if (type === 'edit') {
                client.publish(`request/post/${newData[i].requestedTo}`, JSON.stringify({ type: 'post', fun: 'edit', post }));
            }
            if (type === 'like') {
                client.publish(`request/post/${newData[i].requestedTo}`, JSON.stringify({ type: 'post', fun: 'like', post }));
            }
            if (type === 'unlike') {
                client.publish(`request/post/${newData[i].requestedTo}`, JSON.stringify({ type: 'post', fun: 'unlike', post }));
            }
            if (type === 'comment') {
                client.publish(`request/post/${newData[i].requestedTo}`, JSON.stringify({ type: 'post', fun: 'comment', post }));
            }
        }
        if (newData[i].requestedTo == userId) {
            if (type === 'add') {
                client.publish(`request/post/${newData[i].requestedFrom}`, JSON.stringify({ type: 'post', fun: 'add', post }));
            }
            if (type === 'delete') {
                client.publish(`request/post/${newData[i].requestedFrom}`, JSON.stringify({ type: 'post', fun: 'delete', post }));
            }
            if (type === 'edit') {
                client.publish(`request/post/${newData[i].requestedFrom}`, JSON.stringify({ type: 'post', fun: 'edit', post }));
            }
            if (type === 'like') {
                client.publish(`request/post/${newData[i].requestedFrom}`, JSON.stringify({ type: 'post', fun: 'like', post }));
            }
            if (type === 'unlike') {
                client.publish(`request/post/${newData[i].requestedFrom}`, JSON.stringify({ type: 'post', fun: 'unlike', post }));
            }
            if (type === 'comment') {
                client.publish(`request/post/${newData[i].requestedFrom}`, JSON.stringify({ type: 'post', fun: 'comment', post }));
            }
        }
    }

    if (count >= newData.length) {
        return new Promise((resolve, reject) => {
            const success = true;
            if (success) {
                resolve(newData);
            } else {
                reject("Something went wrong.");
            }
        })
    }
}

module.exports = {
    addPost,
    getPosts,
    deletePost,
    editPost,
    likePost,
    unlikePost,
    getComments,
    testing,
    addComment
};