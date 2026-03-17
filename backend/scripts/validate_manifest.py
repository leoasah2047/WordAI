import xml.etree.ElementTree as ET
import sys
import os

def validate_manifest(file_path):
    print(f"Validating manifest: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return False
    
    try:
        # Define namespaces
        ns = {
            '': 'http://schemas.microsoft.com/office/appforoffice/1.1',
            'bt': 'http://schemas.microsoft.com/office/officeappbasictypes/1.0',
            'ov': 'http://schemas.microsoft.com/office/taskpaneappversionoverrides'
        }
        
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        target_domain = "word-ai-lac.vercel.app"
        expected_resource_prefix = f"api://{target_domain}/"
        
        errors = []
        
        # 1. Check SourceLocation
        source_loc = root.find(".//DefaultSettings/SourceLocation", ns)
        if source_loc is not None:
            val = source_loc.get("DefaultValue")
            if target_domain not in val:
                errors.append(f"SourceLocation DefaultValue incorrect: {val}")
        
        # 2. Check AppDomains
        app_domains = root.findall(".//AppDomains/AppDomain", ns)
        found_domain = False
        for ad in app_domains:
            if ad.text == f"https://{target_domain}":
                found_domain = True
            elif "word.msq.pub" in ad.text or "horosama.com" in ad.text:
                 errors.append(f"Old domain found in AppDomains: {ad.text}")
        
        if not found_domain:
            errors.append(f"Target domain https://{target_domain} not found in AppDomains")
            
        # 3. Check WebApplicationInfo Resource
        resource = root.find(".//WebApplicationInfo/Resource", ns)
        if resource is not None:
            if not resource.text.startswith(expected_resource_prefix):
                errors.append(f"WebApplicationInfo Resource prefix incorrect: {resource.text}")
        
        # 4. Check Resources (URLs and Images)
        for url in root.findall(".//bt:Urls/bt:Url", ns):
            val = url.get("DefaultValue")
            if "msq.pub" in val:
                errors.append(f"Old domain found in bt:Url: {val}")
                
        for img in root.findall(".//bt:Images/bt:Image", ns):
            val = img.get("DefaultValue")
            if "msq.pub" in val:
                errors.append(f"Old domain found in bt:Image: {val}")

        if errors:
            print("Validation FAILED:")
            for err in errors:
                print(f" - {err}")
            return False
        else:
            print("Validation PASSED: All occurrences of the old domain have been replaced and structure is correct.")
            return True
            
    except Exception as e:
        print(f"Error parsing or validating XML: {e}")
        return False

if __name__ == "__main__":
    manifest_path = r"c:\Users\pc\Documents\Consortium\Products\Word-AI\release\instant-use\manifest.xml"
    if validate_manifest(manifest_path):
        sys.exit(0)
    else:
        sys.exit(1)
