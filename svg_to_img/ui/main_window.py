import queue
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from queue import Queue
from threading import Thread
from typing import Callable, Optional, TYPE_CHECKING
from pathlib import Path
from PIL import Image, ImageTk

if TYPE_CHECKING:
    from converter.svg_converter import SVGConverter, ConversionOptions

class MainWindow(tk.Tk):
    def __init__(self, converter: "SVGConverter"):
        super().__init__()
        self.converter = converter
        self.title("SVG Converter")
        self.geometry("800x600")

        self.queue = Queue()
        self.after(100, self.process_queue)

        self.current_svg_path: Optional[str] = None
        self.preview_image = None
        self.preview_photo = None

        self._create_layout()
        self._create_widgets()
        self._bind_events()

    def _create_layout(self) -> None:
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(1, weight=1)

        self.toolbar = ttk.Frame(self)
        self.toolbar.grid(row=0, column=0, columnspan=3, sticky="ew")

        self.sidebar = ttk.Frame(self, width=200)
        self.sidebar.grid(row=1, column=0, sticky="ns")

        self.preview_panel = ttk.Frame(self)
        self.preview_panel.grid(row=1, column=1, sticky="nsew")
        self.preview_panel.grid_rowconfigure(1, weight=1)
        self.preview_panel.grid_columnconfigure(0, weight=1)

        self.settings_panel = ttk.Frame(self, width=200)
        self.settings_panel.grid(row=1, column=2, sticky="ns")

        self.status_bar = ttk.Frame(self)
        self.status_bar.grid(row=2, column=0, columnspan=3, sticky="ew")

    def _create_widgets(self) -> None:
        self.open_button = ttk.Button(self.toolbar, text="Open")
        self.open_button.pack(side="left", padx=5, pady=5)

        self.convert_button = ttk.Button(self.toolbar, text="Convert")
        self.convert_button.pack(side="left", padx=5, pady=5)
        self.convert_button.config(state="disabled")

        self.history_label = ttk.Label(self.sidebar, text="Conversion History")
        self.history_label.pack(pady=5)

        self.history_list = tk.Listbox(self.sidebar)
        self.history_list.pack(fill="both", expand=True, padx=5, pady=5)
        self._refresh_history()

        self.preview_label = ttk.Label(self.preview_panel, text="Preview")
        self.preview_label.grid(row=0, column=0, pady=5)

        self.preview_canvas = tk.Canvas(self.preview_panel, bg="white")
        self.preview_canvas.grid(row=1, column=0, sticky="nsew", padx=5, pady=5)
        self.preview_canvas.bind("<Configure>", self._on_canvas_resize)

        self.format_label = ttk.Label(self.settings_panel, text="Output Format")
        self.format_label.pack(pady=5)

        self.format_var = tk.StringVar(value="png")
        self.format_dropdown = ttk.Combobox(
            self.settings_panel, textvariable=self.format_var, values=["png", "jpeg", "webp", "pdf"], state="readonly"
        )
        self.format_dropdown.pack(fill="x", padx=5, pady=5)

        self.quality_label = ttk.Label(self.settings_panel, text="Quality")
        self.quality_label.pack(pady=5)

        self.quality_var = tk.IntVar(value=90)
        self.quality_slider = ttk.Scale(
            self.settings_panel, variable=self.quality_var, from_=1, to=100, orient="horizontal"
        )
        self.quality_slider.pack(fill="x", padx=5, pady=5)

        self.status_label = ttk.Label(self.status_bar, text="Ready")
        self.status_label.pack(side="left", padx=5, pady=5)

    def _bind_events(self) -> None:
        self.open_button.config(command=self.open_file)
        self.convert_button.config(command=self.convert)

    def process_queue(self) -> None:
        try:
            while True:
                callback = self.queue.get_nowait()
                callback()
        except queue.Empty:
            pass
        finally:
            self.after(100, self.process_queue)

    def update_status(self, message: str) -> None:
        def callback():
            self.status_label.config(text=message)
        self.queue.put(callback)

    def _refresh_history(self):
        try:
            history = self.converter.history_manager.get_history()
            self.history_list.delete(0, tk.END)
            for item in reversed(history[-20:]): # Show last 20
                input_name = Path(item["input_path"]).name
                output_name = Path(item["output_path"]).name
                self.history_list.insert(tk.END, f"{input_name} -> {output_name}")
        except Exception:
            pass

    def open_file(self) -> None:
        file_path = filedialog.askopenfilename(
            title="Select SVG File",
            filetypes=[("SVG files", "*.svg"), ("All files", "*.*")]
        )
        
        if not file_path:
            return

        self.current_svg_path = file_path
        self.update_status(f"Loading {Path(file_path).name}...")
        
        def _load_preview():
            try:
                # Load metadata
                metadata = self.converter.get_metadata(self.current_svg_path)
                
                # Load preview (max 800x800 for canvas)
                preview = self.converter.create_preview(self.current_svg_path, max_size=800)
                
                def _update_ui():
                    self.preview_image = preview
                    self._draw_preview()
                    self.convert_button.config(state="normal")
                    self.status_label.config(text=f"Loaded {Path(file_path).name} ({metadata.width}x{metadata.height})")
                
                self.queue.put(_update_ui)
            except Exception as e:
                def _show_error():
                    messagebox.showerror("Error", f"Failed to load SVG:\n{str(e)}")
                    self.status_label.config(text="Error loading file")
                self.queue.put(_show_error)

        Thread(target=_load_preview, daemon=True).start()

    def _on_canvas_resize(self, event):
        if self.preview_image:
            self._draw_preview()

    def _draw_preview(self):
        if not self.preview_image:
            return
            
        canvas_width = self.preview_canvas.winfo_width()
        canvas_height = self.preview_canvas.winfo_height()
        
        if canvas_width <= 1 or canvas_height <= 1:
            return

        img = self.preview_image.copy()
        img.thumbnail((canvas_width, canvas_height), Image.LANCZOS)
        
        self.preview_photo = ImageTk.PhotoImage(img)
        self.preview_canvas.delete("all")
        
        x = (canvas_width - img.width) // 2
        y = (canvas_height - img.height) // 2
        
        self.preview_canvas.create_image(x, y, anchor="nw", image=self.preview_photo)

    def convert(self) -> None:
        if not self.current_svg_path:
            return

        fmt = self.format_var.get()
        suggested_ext = f".{fmt}"
        
        output_path = filedialog.asksaveasfilename(
            title="Save Image As",
            defaultextension=suggested_ext,
            filetypes=[(f"{fmt.upper()} files", f"*{suggested_ext}"), ("All files", "*.*")]
        )
        
        if not output_path:
            return

        quality = self.quality_var.get()
        
        self.update_status("Converting...")
        self.convert_button.config(state="disabled")

        def _do_convert():
            try:
                from converter.svg_converter import ConversionOptions
                options = ConversionOptions(
                    output_format=fmt,
                    quality=quality
                )
                
                result = self.converter.convert(self.current_svg_path, output_path, options)
                
                def _update_ui():
                    self.convert_button.config(state="normal")
                    if result.success:
                        self.status_label.config(text=f"Successfully saved to {Path(output_path).name}")
                        self._refresh_history()
                    else:
                        messagebox.showerror("Conversion Error", str(result.error))
                        self.status_label.config(text="Conversion failed")
                        
                self.queue.put(_update_ui)
                
            except Exception as e:
                def _show_error():
                    self.convert_button.config(state="normal")
                    messagebox.showerror("Error", f"An unexpected error occurred:\n{str(e)}")
                    self.status_label.config(text="Error")
                self.queue.put(_show_error)

        Thread(target=_do_convert, daemon=True).start()
