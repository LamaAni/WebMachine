{
  "targets": [
    {
      "target_name": "WdCPPExtend",
      "sources": [ "WdCPPExtend.cpp" ],
      "link_settings" : {
      		'libraries': [
      			'$(pkg-config --cflags --libs x11)',
      			'$(pkg-config --libs gl)',
      			'$(pkg-config --libs glesv2)',
      			'$(pkg-config --libs sdl)',
      			]
      },
    }
  ]
}