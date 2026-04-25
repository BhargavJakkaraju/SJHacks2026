async def mesh_from_image(image_url: str) -> str:
    """
    Stub for image -> mesh generation.
    Replace with TripoSR/Shap-E API call.
    """
    _ = image_url
    return "https://example.com/mock/raw-mesh.obj"


async def postprocess_mesh(mesh_url: str) -> str:
    """
    Stub for mesh cleanup + texture + GLB packaging.
    """
    _ = mesh_url
    return "https://example.com/mock/final-model.glb"
