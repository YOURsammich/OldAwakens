window.$$$ = {
    query : function (identifier) {
        return document.querySelector(identifier);
    },
    draggable : function (el, stopOn) {
        var container = document.getElementById('messages'),
            clickX = 0,
            clickY = 0;
        
        el.style.position = 'absolute';
        
        if (!el.style.left) {
            el.style.left = el.offsetLeft + 'px';
            el.style.top = el.offsetTop + 'px';   
        }
        
        function drag(event) {
            var clientX = event.clientX || event.touches[0].clientX,
                clientY = event.clientY || event.touches[0].clientY;
            
            var movementX = (clientX - clickX) - parseInt(el.style.left, 10),
                movementY = (clientY - clickY) - parseInt(el.style.top, 10),
                newLeft = parseInt(el.style.left, 10) + movementX,
                newTop = parseInt(el.style.top, 10) + movementY;
                
            if (newLeft + el.offsetWidth < container.offsetWidth) {
                if (newLeft >= container.offsetLeft) {
                    el.style.left = newLeft + 'px';
                } else {
                    el.style.left = container.offsetLeft + 'px';
                }
            } else {
                el.style.left = (container.offsetWidth - el.offsetWidth) + 'px';
            }
            
            if (newTop + el.offsetHeight < container.offsetHeight) {
                if (newTop >= container.offsetTop) {
                     el.style.top = newTop + 'px';
                } else {
                    el.style.top = container.offsetTop + 'px';
                }
            } else {
                el.style.top = (container.offsetHeight - el.offsetHeight) + 'px';
            }
        }
        
        function remove() {
            var iframe = el.getElementsByTagName('iframe');
            
            if (iframe && iframe[0]) {
               iframe[0].style.pointerEvents = '';
            }

            el.removeEventListener('mousemove', drag);
            container.removeEventListener('mousemove', drag);
            document.body.classList.remove('noselect');
        }
        
        el.addEventListener('mousedown', function (e) {
            var target = e.target || e.srcElement,
                valid = true,
                iframe = el.getElementsByTagName('iframe');
            
            if (iframe && iframe[0]) {
               iframe[0].style.pointerEvents = 'none';
            }
            
            if (!target.classList.contains('resizable-handle') && (!stopOn || target.className !== stopOn)) {
                if (stopOn) {
                    for (var i = 0; i < e.path.length; i++) {
                        if (e.path[i].className == stopOn) {
                            valid = false;
                        }
                    }   
                }
                if (valid) {
                    clickX = e.clientX - parseInt(el.style.left, 10);
                    clickY = e.clientY - parseInt(el.style.top, 10);
                    el.addEventListener('mousemove', drag);
                    container.addEventListener('mousemove', drag);
                    document.body.classList.add('noselect');   
                }
            }
        });
                
        el.addEventListener('mouseup', remove);
        container.addEventListener('mouseup', remove);
    },
    resizeable : function () {
        
    },
    tabber : function (panels, openPanelID) {
        var i,
            allPanels = document.getElementById(panels).children;
        
        for (i = 0; i < allPanels.length; i++) {
            allPanels[i].style.display = 'none';
        }

        document.getElementById(openPanelID).style.display = 'block';
    },
    palette : function (el, func, save) {
        var restoreColor,
            container = document.createElement('div'),
            specContainer = document.createElement('div'),
            spec = document.createElement('div'),
            circle = document.createElement('span'),
            slider = document.createElement('div'),
            sliderKnob = document.createElement('span'),
            input = document.createElement('input'),
            buttonHold = document.createElement('div'),
            cancelButton = document.createElement('button'),
            saveButton = document.createElement('button'),
            dragging = false,
            sliding = false,
            theSeed = 0,
            cursorX = 0,
            cursorY = 0;
        
        function hexToRgb(hex) {
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        function betweenNumbers (startInt, endInt, prec) {
            return startInt + (endInt - startInt) / (100 / prec);
        }
        
        function rebetweenNumbers (startInt, endInt, a) {
            return (a - startInt) / ((endInt - startInt) / 100);
        }
        
        function getLower (endInt, prec, a) {
            return (a * (100/prec) - endInt) / ((100/prec) -1);
        }
        
        function getHigher (prec, a) {
            return a / (1 - (prec / 100));
        }
        
        function getHigher2 (startInt, prec, a) {
            return (a - startInt) * (100 / prec) + startInt;
        }
        
        container.id = 'stylePalette';
        
        function resize () {
            var elementsPos = el.getBoundingClientRect(),
                height = 0;
            
            if (250 + elementsPos.top + elementsPos.height < window.innerHeight) {
                height = elementsPos.top + elementsPos.height;
            } else {
                height = elementsPos.top - elementsPos.height - 208;
            }
            container.style.left = elementsPos.left + 'px';
            container.style.top = height + 'px';
        }
        resize();
        window.addEventListener('resize', resize);
        
        specContainer.id = 'specon';
        specContainer.style.backgroundColor = 'rgb(255,0,0)';
        spec.id = 'spec';
        circle.id = 'speccircle';
        
        circle.style.left = '0px';
        circle.style.top = '0px';
        
        container.appendChild(input);
        specContainer.appendChild(spec);
        specContainer.appendChild(circle);
        container.appendChild(specContainer);
        
        function mapColor (hex) {
            var validHex = /#([\da-f]{6}|[\da-f]{3})(.+)$/i,
                rgb,
                fixedSeed,
                X,
                Y,
                d,
                xf;

            if (!validHex.test(hex)) {
                hex = input.value;
            }
            
            rgb = hexToRgb(hex);
            if (rgb) {
                fixedSeed = 0;
                if (rgb.r >= rgb.b && rgb.r >= rgb.g) {
                    if (rgb.b > rgb.g) {
                        fixedSeed = 1275;
                        d = rebetweenNumbers(0, 255, rgb.g);
                        Y = rebetweenNumbers(255, 0, rgb.b);
                        X = (((d * 100) / (100 - Y)) * -1) + 100;
                        fakeseedY = getHigher(Y, rgb.r);
                        fixedSeed = Math.round(getHigher2(1275, X, (1275 + (255 - fakeseedY))));
                    } else {
                        d = rebetweenNumbers(0, 255, rgb.b);
                        Y = rebetweenNumbers(255, 0, rgb.r);
                        X = (((d * 100) / (100 - Y)) * -1) + 100;
                        fakeseedY = getHigher(Y, rgb.g);
                        fakeseedX = Math.round(getLower(255, 100 - X, fakeseedY));
                        
                        if (fakeseedX == Infinity) {
                            fakeseedX = 0;
                        }
                        
                        if (!isNaN(fakeseedX)) {
                            fixedSeed += fakeseedX;
                        } else {
                            fixedSeed += fakeseedY;
                        }
                    }
                } else if (rgb.g >= rgb.r && rgb.g >= rgb.b) {
                    if (rgb.r > rgb.b) {
                        fixedSeed = 255;
                        d = rebetweenNumbers(0, 255, rgb.b);
                        Y = rebetweenNumbers(255, 0, rgb.g);
                        X = (((d * 100) / (100 - Y)) * -1) + 100;
                        fakeseedY = getHigher(Y, rgb.r);
                        fixedSeed = Math.round(getHigher2(255, X, (255 + (255 - fakeseedY))));
                    } else {
                        fixedSeed = 510;
                        d = rebetweenNumbers(0, 255, rgb.r);
                        Y = rebetweenNumbers(255, 0, rgb.g);
                        X = (((d * 100) / (100 - Y)) * -1) + 100;
                        fakeseedY = getHigher(Y, rgb.b);
                        fakeseedX = Math.round(getLower(255, 100 - X, fakeseedY));

                        if (fakeseedX == Infinity) {
                            fakeseedX = 0;
                        }
                        
                        if (!isNaN(fakeseedX)) {
                            fixedSeed += fakeseedX;
                        } else {
                            fixedSeed += fakeseedY;
                        }
                    }
                } else if (rgb.b >= rgb.r && rgb.b >= rgb.g) {
                    if (rgb.g > rgb.r) {
                        fixedSeed = 765;
                        d = rebetweenNumbers(0, 255, rgb.r);
                        Y = rebetweenNumbers(255, 0, rgb.b);
                        X = (((d * 100) / (100 - Y)) * -1) + 100;
                        fakeseedY = getHigher(Y, rgb.g);
                        fixedSeed = Math.round(getHigher2(765, X, (765 + (255 - fakeseedY))));
                    } else {
                        fixedSeed = 1020;
                        d = rebetweenNumbers(0, 255, rgb.g);
                        Y = rebetweenNumbers(255, 0, rgb.b);
                        X = (((d * 100) / (100 - Y)) * -1) + 100;
                        fakeseedY = getHigher(Y, rgb.r);
                        fakeseedX = Math.round(getLower(255, 100 - X, fakeseedY));
                        
                        if (fakeseedX == Infinity) {
                            fakeseedX = 0;
                        }
                        
                        if (!isNaN(fakeseedX)) {
                            fixedSeed += fakeseedX;
                        } else {
                            fixedSeed += fakeseedY;
                        }
                    }
                }
                cursorX = (X * 200) / 100;
                cursorY = (Y * 150) / 100;
                
                theSeed = fixedSeed;  
                sliderKnob.style.left = betweenNumbers(0, 200, rebetweenNumbers(0, 1275, theSeed)) + 'px';
                selectColor(cursorX, cursorY);
            }
        }
        
        input.addEventListener('keyup', mapColor);
        
        function selectColor(X, Y) {
            var fixedSeed = theSeed,
                x = (X / 200) * 100,
                y = (Y / 150) * 100,
                d = ((100 - y) * (100 - x) / 100),
                xf,
                red,
                green,
                blue;
            
            if (fixedSeed >= 1275) {
                fixedSeed -= 1275;
                specContainer.style.backgroundColor = 'rgb(' + (255 - fixedSeed) + ', 0, 255)';
                xf = Math.round(betweenNumbers(0, (255 - fixedSeed), y));
                red = Math.round(betweenNumbers(255, 0, y));
                green = Math.round(betweenNumbers(0, 255, d));
                blue = Math.round(betweenNumbers((255 - fixedSeed) - xf, 255 - xf, d));
            } else if (fixedSeed > 1020) {
                fixedSeed -= 1020;
                specContainer.style.backgroundColor = 'rgb(' + fixedSeed + ', 0, 255)';
                xf = Math.round(betweenNumbers(0, fixedSeed, y));
                red = Math.round(betweenNumbers(fixedSeed - xf, 255 - xf, d));
                green = Math.round(betweenNumbers(0, 255, d));
                blue = Math.round(betweenNumbers(255, 0, y));
            } else if (fixedSeed >= 765) {
                fixedSeed -= 765;
                specContainer.style.backgroundColor = 'rgb(0, ' + (255 - fixedSeed) + ', 255)';
                xf = Math.round(betweenNumbers(0, (255 - fixedSeed), y));
                red = Math.round(betweenNumbers(0, 255, d));
                green = Math.round(betweenNumbers((255 - fixedSeed) - xf, 255 - xf, d));
                blue = Math.round(betweenNumbers(255, 0, y));
            } else if (fixedSeed > 510) {
                fixedSeed -= 510;
                specContainer.style.backgroundColor = 'rgb(0, 255, ' + fixedSeed + ')';
                xf = Math.round(betweenNumbers(0, fixedSeed, y));
                red = Math.round(betweenNumbers(0, 255, d));
                green = Math.round(betweenNumbers(255, 0, y));
                blue = Math.round(betweenNumbers(fixedSeed - xf, 255 - xf, d));
            } else if (fixedSeed >= 255) {
                fixedSeed -= 255;
                specContainer.style.backgroundColor = 'rgb(' + (255 - fixedSeed) + ', 255, 0)';
                xf = Math.round(betweenNumbers(0, 255 - fixedSeed, y));
                red = Math.round(betweenNumbers((255 - fixedSeed) - xf, 255 - xf, d));
                green = Math.round(betweenNumbers(255, 0, y));
                blue = Math.round(betweenNumbers(0, 255, d));
            } else if (fixedSeed < 255) {
                specContainer.style.backgroundColor = 'rgb(255, ' + fixedSeed + ', 0)';
                xf = Math.round(betweenNumbers(0, fixedSeed, y));
                red = Math.round(betweenNumbers(255, 0, y));
                green = Math.round(betweenNumbers(fixedSeed - xf, 255 - xf, d));
                blue = Math.round(betweenNumbers(0, 255, d));
            }
        
            input.value = rgbToHex(red, green, blue);
            el.style.backgroundColor = rgbToHex(red, green, blue);
            
            circle.style.left = X + 'px';
            circle.style.top = Y + 'px';
            
            func(input.value.slice(1));
        }
        
        specContainer.addEventListener('mousedown', function (e) {
            var specPos = specContainer.getBoundingClientRect();  
            dragging = true; 
            if (e.target.id == 'spec') {
                cursorY = e.clientY - specPos.top;
                cursorX = e.clientX - specPos.left;
                selectColor(cursorX, cursorY);   
            }
        });
        
        document.body.addEventListener('mouseup', function () {
            dragging = false;
            sliding = false;
        });
        
        document.body.addEventListener('mousemove', function (e) {
            var specPos = specContainer.getBoundingClientRect();        
                if (dragging) {
                cursorY = e.clientY - specPos.top;
                cursorX = e.clientX - specPos.left;

                if (cursorY < 0) {
                    cursorY = 0
                } else if (cursorY > specPos.height) {
                    cursorY = specPos.height;
                }

                if (cursorX < 0) {
                    cursorX = 0
                } else if (cursorX > specPos.width) {
                    cursorX = specPos.width;
                }
                selectColor(cursorX, cursorY);
            }
        });
        
        slider.appendChild(sliderKnob);
        
        sliderKnob.style.left = '0px';
        slider.id = 'styleslider';
        container.appendChild(slider);
        
        sliderKnob.addEventListener('mousedown', function () {
            sliding = true;
        });
        
        document.body.addEventListener('mousemove', function (e) {
            var specPos = slider.getBoundingClientRect(),
                clientX = e.clientX - specPos.left;
            
            if (clientX < 0) {
                clientX = 0
            } else if (clientX > specPos.width) {
                clientX = specPos.width;
            }
            
            if (sliding) {
                sliderKnob.style.left = clientX + 'px';
                theSeed = Math.round(betweenNumbers(0, 1275, parseInt(sliderKnob.style.left) / 2));
                selectColor(cursorX, cursorY);
            }
        });
        
        cancelButton.textContent = 'cancel';
        saveButton.textContent = 'save';
        saveButton.style.float = 'right';
        
        buttonHold.id = 'buttonHold';
        buttonHold.appendChild(cancelButton);
        buttonHold.appendChild(saveButton);
        container.appendChild(buttonHold);
        
        saveButton.addEventListener('click', function () {
            save(input.value);
            document.body.removeChild(container);
        });
        
        cancelButton.addEventListener('click', function () {
            func(restoreColor.slice(1));
            document.body.removeChild(container);
        });
        
        function rgb2hex(rgb) {
            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }
        
        document.body.appendChild(container);
        restoreColor = rgb2hex(window.getComputedStyle(el).backgroundColor);
        mapColor(restoreColor);
    }
};