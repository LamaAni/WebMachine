# compilation makefile.
SOURCES=
PACKAGES=egl glesv2 x11
LIBS=
LFLAGS=-o3
CFLAGS=-Wall
COMPILER=g++
CODEFILEEXTENTIONS=c cc cpp


###################
## Compilation code ceation
# define compilation path if needed
ifndef AT
	AT=$(shell pwd)
endif

CC=$(shell which $(COMPILER))
ifndef SOURCES
	SOURCES=$(foreach ext,$(CODEFILEEXTENTIONS),$(shell find "$(AT)" -name "*.$(ext)"))
endif

# define the app name if needed
ifndef NAME
	NAME=$(AT)/$(basename $(notdir $(firstword $(SOURCES))))
endif

LF=$(LFLAGS) $(foreach l,$(LIBS),-l$(l)) $(shell pkg-config --libs --cflags $(PACKAGES))
CF=$(CFLAGS)
OSOURCES=$(addsuffix .o,$(basename $(SOURCES)))

all: vebrose
	@echo -e "\nCompile"
	@echo -e "========================"
	$(CC) -c $(SOURCES) $(CF)
	@echo -e "\nLinking into " $(NAME)
	@echo -e "========================"
	$(CC) $(OSOURCES) $(LF) -o $(NAME)
vebrose:
	@echo "Definitions for the make,"
	@echo "========================"
	@echo -e "Working at:\t"$(AT)
	@echo -e "Code sources:\n"$(addprefix "\t\t",$(addsuffix "\n",$(SOURCES)))
	@echo -e "Linking Flags:\n"$(addprefix "\t\t",$(addsuffix "\n",$(LF)))
	@echo -e "Compilation Flags:\n"$(addprefix "\t\t",$(addsuffix "\n",$(CF)))
	@echo -e "Output file:\t"$(NAME)
	@echo -e "COMPILER AT:\t"$(CC)".o"
	@echo -e ""
	@echo -e "Making..."
	
