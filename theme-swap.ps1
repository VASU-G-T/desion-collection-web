$files = Get-ChildItem -Path "c:\Users\papat\Downloads\nextprinters-collections-vault\src" -Recurse -Include *.tsx, *.ts, *.css

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Backgrounds & Borders
    $content = $content -replace 'bg-slate-950', 'bg-slate-50'
    $content = $content -replace 'bg-slate-900', 'bg-white'
    $content = $content -replace 'bg-slate-800', 'bg-slate-100'
    $content = $content -replace 'border-slate-800', 'border-slate-200'
    $content = $content -replace 'border-slate-700', 'border-slate-300'
    
    # Text colors
    $content = $content -replace 'text-slate-100', 'text-slate-900'
    $content = $content -replace 'text-slate-200', 'text-slate-800'
    $content = $content -replace 'text-slate-300', 'text-slate-700'
    $content = $content -replace 'text-slate-400', 'text-slate-500'
    $content = $content -replace 'text-slate-500', 'text-slate-400'
    
    # Accent Colors
    $content = $content -replace 'amber-500', 'sky-500'
    $content = $content -replace 'orange-500', 'sky-500'
    $content = $content -replace 'amber-400', 'sky-400'
    $content = $content -replace 'amber-300', 'sky-600'
    $content = $content -replace 'amber-200', 'sky-700'
    $content = $content -replace 'amber-100', 'sky-800'
    
    # Specific UI removals handling (we will manually edit Navbar and FilterBar for structural changes, but just in case, we do the theme swap first)

    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Theme swap completed successfully!"
