import 'dart:convert';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'dart:io';
import 'dart:typed_data';
import "package:flutter/material.dart";
import "package:http/http.dart" as http;
import "package:http_parser/http_parser.dart";
import "package:image_picker/image_picker.dart";
import 'package:path_provider/path_provider.dart';
import 'package:image_cropper/image_cropper.dart';

void main() {
  runApp(DocScan());
}

class DocScan extends StatefulWidget {
  _DocScanState createState() => _DocScanState();
}

class _DocScanState extends State<DocScan> {
  File _image, _edited;
  bool received = false, edited = false;
  Uint8List _received;
  String receivedPath;

  getImage(int choice) async {
    var pickedFile;
    if (choice == 1)
      pickedFile = await ImagePicker().getImage(source: ImageSource.gallery);
    else
      pickedFile = await ImagePicker().getImage(source: ImageSource.camera);

    if (pickedFile != null)
      setState(() {
        _image = File(pickedFile.path);
        received = false;
      });
    else {
      print("File not selected");
    }
  }

  void uploadImage(File _image) async {
    var uri = Uri.parse("http://10.0.2.2:3000/uploadImage");
    var request = http.MultipartRequest("POST", uri)
      ..files.add(await http.MultipartFile.fromPath("image", _image.path,
          contentType: new MediaType("image", "jpeg")));
    var stream = await request.send();
    if (stream.statusCode == 200) {
      print("Edited Image Received");
      var response = await http.Response.fromStream(stream);
      _received = response.bodyBytes;
      final directory = await getExternalStorageDirectory();
      final file = new File("${directory.path}/image.jpeg");
      file.writeAsBytesSync(_received);
      setState(() {
        received = true;
        receivedPath = file.path;
      });
    } else
      print("Error" + stream.toString());
  }

  Widget returnImage(File _image, bool received) {
    if (_image != null && !received)
      return Image.file(_image);
    else if (_image == null)
      return Text("Select an image source");
    else if (edited)
      return Image.file(_edited);
    else {
      return Image.memory(_received);
    }
  }

  void cropImage() async {
    var path;
    if (_image != null) path = _image.path;
    if (received)
      path = receivedPath;   
    _edited = await ImageCropper.cropImage(
        sourcePath: path,
        aspectRatioPresets: [
          CropAspectRatioPreset.square,
          CropAspectRatioPreset.ratio3x2,
          CropAspectRatioPreset.original,
          CropAspectRatioPreset.ratio4x3,
          CropAspectRatioPreset.ratio16x9
        ],
        androidUiSettings: AndroidUiSettings(
            toolbarTitle: 'Cropper',
            toolbarColor: Colors.deepOrange,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.original,
            lockAspectRatio: false),
        iosUiSettings: IOSUiSettings(
          minimumAspectRatio: 1.0,
        ));
    if (_edited != null)
      setState(() {
        edited = true;
      });
  }

  saveAsPDF() async {
    final pdf = pw.Document();
    var image;
    if (received)
      image = PdfImage.file(pdf.document, bytes: _received);
    else
      image = PdfImage.file(pdf.document, bytes: _image.readAsBytesSync());
    pdf.addPage(pw.Page(
      build: (pw.Context context) {
        return pw.Center(child: pw.Image(image));
      },
    ));
    final directory = await getExternalStorageDirectory();
    final file = new File("${directory.path}/result.pdf");
    await file.writeAsBytes(pdf.save());
    if (file != null) print("PDF saved successfully");
  }

  Widget build(BuildContext context) {
    return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
            appBar: AppBar(
              actions: [
                Container(
                  child: IconButton(
                    icon: Icon(Icons.file_upload),
                    color: Colors.blue,
                    onPressed: () {
                      if (_image != null) uploadImage(_image);
                    },
                  ),
                ),
                Container(
                  child: IconButton(
                    icon: Icon(Icons.save),
                    color: Colors.blue,
                    onPressed: () {
                      if (_image != null || received) saveAsPDF();
                    },
                  ),
                ),
                Container(
                  child: IconButton(
                    icon: Icon(Icons.crop),
                    color: Colors.blue,
                    onPressed: () {
                      if (_image != null || received) cropImage();
                    },
                  ),
                )
              ],
              backgroundColor: Colors.white,
              title: Text(
                "CamScanner",
                style: TextStyle(color: Colors.blue),
              ),
              centerTitle: false,
            ),
            body: Container(
              child: returnImage(_image, received),
            ),
            bottomNavigationBar: BottomAppBar(
                color: Colors.white,
                child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Container(
                          child: IconButton(
                        iconSize: 40,
                        icon: Icon(Icons.camera_alt),
                        color: Colors.blue,
                        onPressed: () {
                          getImage(0);
                        },
                      )),
                      Container(
                          child: IconButton(
                        iconSize: 40,
                        icon: Icon(Icons.image),
                        color: Colors.blue,
                        onPressed: () {
                          getImage(1);
                        },
                      )),
                    ]))));
  }
}
