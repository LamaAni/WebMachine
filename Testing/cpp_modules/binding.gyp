{
  "targets": [
    {
      "target_name": "WdCPPExtend",
      "sources": [ "WdCPPExtend.cpp" ],
      "cflags" : ["$(pkg-config --cflags --libs egl glesv2 x11)"],
      "link_settings" : {
      		'libraries': [
      			]
      },
    },
    {
      "target_name": "TestGLX",
      "sources": [ "TestGLX.cpp" ],
      "cflags" : ["$(pkg-config --cflags --libs egl glesv2 x11)"],
      "link_settings" : {
          'libraries': [
            ]
      },
    },
  ]
}