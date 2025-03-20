const mongoose=require('mongoose');

const EventSchema=new mongoose.Schema(
    {
        title:{type:String, required:true},
        description:{type:String},
        date:{type:Date, required:true},
        imageUrl:{type:String},
        attendees:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
        createdBy:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true}
    },
    {timestamps:true}
);

module.exports=mongoose.model('Event', EventSchema);