const { CV_32F, COLOR_BGR5552GRAY, Point, Point2, Size, INTER_LINEAR, BORDER_TRANSPARENT } = require("opencv4nodejs");
const cv = require("opencv4nodejs")
const pdf = require("pdfkit")
const fs = require("fs")
const express = require("express");
const app = express()
const multer = require("multer")
const imagePath = "./uploads/"
const upload = multer({dest:imagePath,preservePath:true})

app.post("/uploadImage",upload.single("image"),(req,res)=>{
if(req.file!=null){
console.log("Image received")
path = imagePath+"original/"+req.file.originalname
fs.rename(req.file.path,path,(err)=>{
if(err){
console.log(err)
res.sendStatus(500)
}
else{
res.sendFile(enhanceImage(path,imagePath+"edited/",req.file.originalname),{
    root:__dirname
},(err)=>{
if(!err)
console.log("Edited image sent")
else
console.log(err)
})
}
})
}
})

function enhanceImage(src,dest,name){

const test = cv.imread(src);
ratio = test.sizes[0]/500
resized = test.resize(500,test.sizes[1])
gray = resized.cvtColor(cv.COLOR_BGR2GRAY)
gblur = gray.gaussianBlur(new cv.Size(5,5),0)
can = gblur.canny(75,200,3)
contours = can.findContours(cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE,new Point2(0,0))
contours = contours.sort((a,b)=> b.area-a.area)

newContours = contours.map((contour)=>{
    return contour.getPoints();
})

newContoursOriginal = newContours[0].map((contour)=>{
    return new Point2(contour.x,contour.y*ratio)
})

// test.drawContours([newContoursOriginal],0,new cv.Vec3(0,255,0),2)

var tl=999999,tr=999999,br=0,bl=0
var TL,TR,BR,BL
newContoursOriginal.forEach(element => {
    if(element.x+element.y<tl){
        TL=element
        tl=element.x+element.y
    }
    if(element.x+element.y>br){
        BR = element
        br=element.x+element.y
    }
    if(element.x-element.y<tr){
        TR = element
        tr=element.x-element.y
    }
    if(element.x-element.y>bl){
        BL = element
        bl=element.x-element.y
    }
});

widthA = Math.sqrt(Math.pow(BR.x-BL.x,2)+Math.pow(BR.y-BL.y,2))
widthB = Math.sqrt(Math.pow(TR.x-TL.x,2)+Math.pow(TR.y-TL.y,2))
maxWidth = Math.max(widthA,widthB)


heightA = Math.sqrt(Math.pow(TR.x-BR.x,2)+Math.pow(TR.y-BR.y,2))
heightB = Math.sqrt(Math.pow(TL.x-BL.x,2)+Math.pow(TL.y-BL.y,2))
maxHeight = Math.max(heightA,heightB)


oldDist = [
    TL,BL,BR,TR
]
newDist = [
    new Point2(0,0),
    new Point2(maxHeight,0),
    new Point2(maxHeight,maxWidth),
    new Point2(0,maxWidth)
]
pt = cv.getPerspectiveTransform(oldDist,newDist)
warped = test.warpPerspective(pt,new Size(maxHeight,maxWidth))
warped = cv.fastNlMeansDenoisingColored(warped,2)
warped = warped.bgrToGray()
// warped = warped.threshold(157,255,cv.THRESH_BINARY)
warped = warped.adaptiveThreshold(255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY,13,2)
kernelArray = [[-1,-1,-1], [-1,10,-1], [-1,-1,-1]]
kernel = new cv.Mat(kernelArray,cv.CV_8SC1)
// warped = warped.filter2D(120,kernel)

// console.log(oldDist)
// console.log(newDist)

fs.mkdir(dest,(err)=>{
if(!err)
console.log("Directory Created")
})
cv.imwrite(dest+name,warped)
return dest+name
// const doc = new pdf()

// doc.pipe(fs.createWriteStream("./output.pdf"))

// doc.image("./result.jpeg",0,0,{
// width:580
// })

// doc.save()
// doc.end()

}
// cv.imshow("original",test.resize(800,test.sizes[1]))
// cv.imshow("cropped",warped.resize(800,warped.sizes[1]))
// cv.waitKey()

const PORT = 3000||process.env.PORT
app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`)
})


const test = cv.imread("./testImage.jpeg");
ratio = test.sizes[0]/500
resized = test.resize(500,test.sizes[1])
gray = resized.cvtColor(cv.COLOR_BGR2GRAY)
gblur = gray.gaussianBlur(new cv.Size(5,5),0)
can = gblur.canny(75,200,3)
contours = can.findContours(cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE,new Point2(0,0))
contours = contours.sort((a,b)=> b.area-a.area)

newContours = contours.map((contour)=>{
    return contour.getPoints();
})

newContoursOriginal = newContours[0].map((contour)=>{
    return new Point2(contour.x,contour.y*ratio)
})

// test.drawContours([newContoursOriginal],0,new cv.Vec3(0,255,0),2)

var tl=999999,tr=999999,br=0,bl=0
var TL,TR,BR,BL
newContoursOriginal.forEach(element => {
    if(element.x+element.y<tl){
        TL=element
        tl=element.x+element.y
    }
    if(element.x+element.y>br){
        BR = element
        br=element.x+element.y
    }
    if(element.x-element.y<tr){
        TR = element
        tr=element.x-element.y
    }
    if(element.x-element.y>bl){
        BL = element
        bl=element.x-element.y
    }
});

widthA = Math.sqrt(Math.pow(BR.x-BL.x,2)+Math.pow(BR.y-BL.y,2))
widthB = Math.sqrt(Math.pow(TR.x-TL.x,2)+Math.pow(TR.y-TL.y,2))
maxWidth = Math.max(widthA,widthB)


heightA = Math.sqrt(Math.pow(TR.x-BR.x,2)+Math.pow(TR.y-BR.y,2))
heightB = Math.sqrt(Math.pow(TL.x-BL.x,2)+Math.pow(TL.y-BL.y,2))
maxHeight = Math.max(heightA,heightB)


oldDist = [
    TL,BL,BR,TR
]
newDist = [
    new Point2(0,0),
    new Point2(maxHeight,0),
    new Point2(maxHeight,maxWidth),
    new Point2(0,maxWidth)
]
pt = cv.getPerspectiveTransform(oldDist,newDist)
warped = test.warpPerspective(pt,new Size(maxHeight,maxWidth))
warped = cv.fastNlMeansDenoisingColored(warped,2)
warped = warped.bgrToGray()
// warped = warped.threshold(157,255,cv.THRESH_BINARY)
warped = warped.adaptiveThreshold(255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY,13,2)
kernelArray = [[-1,-1,-1], [-1,10,-1], [-1,-1,-1]]
kernel = new cv.Mat(kernelArray,cv.CV_8SC1)

cv.imshow("",warped)
cv.imshow("a",test)
cv.waitKey()