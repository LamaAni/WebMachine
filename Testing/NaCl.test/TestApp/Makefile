# this is the testing makefile for NaCl app.
# USer defined for specific compilation.
# the targets that exist 
SOURCES=

FLAGS=-o2
LIBS= ppapi_gles2 ppapi_cpp ppapi pthread 
#$(shell pkg-config --cflags --libs x11)

# Space seperated.
INCLUDEDIRS=/usr/include

# Space seperated.
LIBDIRS=

APPNAME="app"

#################################################
# ncal definitions
COMPILER=g++
COMPILATION_TARGET=$(shell uname -m)
SDK_PATH=$(NACL_SDK_PATH)
PEPPER_DIR=$(shell ls $(SDK_PATH)| grep pepper_ | head -1)

# finding SDK parameters
#PEPPERLIBS=ppapi_cpp ppapi
PEPPERINCLUDEDIR=$(SDK_PATH)/$(PEPPER_DIR)/include
PEPPERLIBDIR=$(SDK_PATH)/$(PEPPER_DIR)/lib/glibc_$(COMPILATION_TARGET)/Release

INCLUDEDIRS:=$(INCLUDEDIRS) $(PEPPERINCLUDEDIR)
LIBDIRS:=$(LIBDIRS) $(PEPPERLIBDIR)

# Collection info
CC=$(SDK_PATH)/$(PEPPER_DIR)/toolchain/linux_x86_glibc/bin/$(COMPILATION_TARGET)-nacl-$(COMPILER)
CF=$(FLAGS) $(foreach pl,$(LIBS),-l$(pl))
CI=$(foreach dir,$(INCLUDEDIRS),-I$(dir))
CL=$(foreach dir,$(LIBDIRS),-L$(dir))
CT=$(shell cat __targets.makenacl.cmnd) $(SOURCES)

CO=-o $(APPNAME).nacl_$(COMPILATION_TARGET).nexe
COMPILERARGS=$(CF) $(CI) $(CL)
all: vebrose
	@echo ""
	@echo "Making.."
	@$(CC) $(CT) $(CF) $(CI) $(CL) $(CO)
vebrose:
	@echo -e "Compiler:\t\t$(CC)"
	@echo -e "Include Path:\t\t$(CI)"
	@echo -e "LIB Path:\t\t$(CL)"
	@echo -e "Compilation flags:\t$(CF)"
	@echo -e "Compiler targets:\t$(CT)"
	@echo -e "Result:\t\t$(CO)"
#echo "$NACL_SDK_PATH"
#echo "$(CC)"