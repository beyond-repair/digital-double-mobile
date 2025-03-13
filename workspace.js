document.addEventListener('DOMContentLoaded', () => {
  // Drag-and-drop functionality for tool windows
  const draggables = document.querySelectorAll('.draggable');
  draggables.forEach(draggable => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = draggable.querySelector('.tool-window');
    
    header && header.addEventListener('mousedown', e => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);
    });

    function elementDrag(e) {
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      draggable.style.top = (draggable.offsetTop - pos2) + 'px';
      draggable.style.left = (draggable.offsetLeft - pos1) + 'px';
    }

    function closeDragElement() {
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    }
  });

  // Radial menu interactions
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const position = item.style.backgroundPosition;
      switch(position) {
        case '-0px -0px':
          openTool('browser');
          break;
        case '-64px -0px':
          openTool('calendar');
          break;
        case '-128px -0px':
          openTool('notes');
          break;
        case '-192px -0px':
          toggleSettings();
          break;
      }
    });
  });

  // Parallax effect
  document.addEventListener('mousemove', (e) => {
    const layer1 = document.querySelector('.layer-1');
    const layer2 = document.querySelector('.layer-2');
    const layer3 = document.querySelector('.layer-3');
    
    layer1.style.transform = `translate(${e.clientX * 0.01}px, ${e.clientY * 0.01}px)`;
    layer2.style.transform = `translate(${e.clientX * 0.02}px, ${e.clientY * 0.02}px)`;
    layer3.style.transform = `translate(${e.clientX * 0.03}px, ${e.clientY * 0.03}px)`;
  });

  // Example tool functions
  function openTool(toolType) {
    const toolWindow = document.createElement('div');
    toolWindow.className = 'tool-window active';
    toolWindow.textContent = `${toolType.charAt(0).toUpperCase()+toolType.slice(1)} Tool`;
    document.getElementById('tool-layout').appendChild(toolWindow);
    toolWindow.focus();
  }

  function toggleSettings() {
    const settingsElement = document.querySelector('.glitch');
    settingsElement.classList.toggle('active');
    // Add more settings logic here
  }
});
