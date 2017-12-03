// C:\Program Files\MongoDB\Server\3.4\bin>mongod.exe --dbpath E:/Node-js/MongoDB-data
require('./config/config');
const _=require('lodash');
var express=require('express');
var bodyParser=require('body-parser');
var {mongoose}=require('./db/mongoose');
var {Todo}=require('./models/todo');
var {User}=require('./models/user');
var {authenticate}=require('./middleware/authenticate');
var {ObjectID}=require('mongodb');
var port=process.env.PORT;
var app=express();
app.use(bodyParser.json());
app.post('/todos',authenticate,(req,res)=>{
    var todo=new Todo({
        text:req.body.text,
        _creator:req.user._id
    });
    todo.save().then((doc)=>{
       res.send(doc); 
    },(err)=>{
        res.status(400).send(err);
    });
    
});
app.get('/todos',authenticate,(req,res)=>{
   Todo.find({_creator:req.user._id}).then((todos)=>{
       res.send({todos,code:200});
   },(err)=>{
       res.status(404).send(err);
   }); 
    
});
app.get('/todos/:id',authenticate,(req,res)=>{
    var id=req.params.id;
    if(!ObjectID.isValid(id))
        return res.status(404).send();
    Todo.findOne({_id:id,_creator:req.user._id}).then((todo)=>{
        if(!todo)
            return res.status(404).send();
        res.send({todo,code:200});
    }).catch((err)=>{
        res.status(400).send();
    })
    
});
app.delete('/todos/:id',authenticate,(req,res)=>{
var id=req.params.id;
if(!ObjectID.isValid(id))
return res.send().status(404);
Todo.findOneAndRemove({
    _id:id,_creator:req.user._id
}).then((todo)=>{
    if(!todo)
    return res.status(404).send();
    res.send({todo,code:200});
}).catch((e)=>{
    res.status(400).send();
})
});
app.patch('/todos/:id',authenticate,(req,res)=>{
    var id=req.params.id;
    var body=_.pick(req.body,['text','completed']);
    if(!ObjectID.isValid(id))
    return res.send().status(404);
    if(_.isBoolean(body.completed)&&body.completed)
    body.completedAt=new Date().getTime();
    else{
        body.completed=false;
        body.completedAt=null;
    }
    Todo.findOneAndUpdate({_id:id,_creator:req.user._id}, {$set:body},{new:true}).then((todo)=>{
        if(!todo)
        return res.status(404).send();
        res.send({todo,code:200});
    }).catch((e)=>{
        res.status(400).send(e);
    });
});
app.post('/users',(req,res)=>{
    var body=_.pick(req.body,['email','password']);
    var user=new User(body);
    user.save().then(()=>{
        return user.generateAuthToken();
    }).then((token)=>{
        res.header('x-auth',token).send(user);
    }).catch((err)=>{
        res.status(400).send(err);
    })
});

app.get('/users/me',authenticate,(req,res)=>{
    res.send(req.user);
});
app.post('/users/login',(req,res)=>{
    var body=_.pick(req.body,['email','password']);
    User.findByCredentials(body.email,body.password).then((user)=>{
        return user.generateAuthToken().then((token)=>{
            res.header('x-auth',token).send(user);            
        });
    }).catch((err)=>{
        res.status(400).send(err);
    });
});
app.delete('/users/me/token',authenticate,(req,res)=>{
    req.user.removeToken(req.token).then(()=>{
        res.send("Logged Out");
    }).catch((err)=>{
        res.status(400).send();
    })
});
app.listen(port,()=>{
    console.log('Server listening on port:3000');
});
module.exports={app};